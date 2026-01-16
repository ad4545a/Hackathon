import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'package:schemesathi/l10n/generated/app_localizations.dart';
import 'scheme_assistant_screen.dart';
import '../services/api_service.dart';

class ResultsScreen extends StatefulWidget {
  final Map<String, dynamic> userProfile;
  
  const ResultsScreen({super.key, required this.userProfile});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  List<Map<String, dynamic>> schemes = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchEligibleSchemes();
  }

  Future<void> _fetchEligibleSchemes() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final response = await ApiService.fetchEligibleSchemes(
        age: widget.userProfile['age'],
        income: widget.userProfile['income'],
        caste: widget.userProfile['caste'],
        occupation: widget.userProfile['occupation'],
        state: widget.userProfile['state'],
      );

      // Transform API response to match UI expectations
      final transformedSchemes = response.map((scheme) {
        return {
          "name": scheme['name'] ?? scheme['schemeName'] ?? 'Unknown Scheme',
          "eligible": true, // All returned schemes are eligible
          "benefit": scheme['benefits'] ?? 'Benefits available',
          "reason": scheme['eligibility'] ?? 'You meet the criteria',
          "next_step": "Visit ${scheme['apply_link'] ?? 'official portal'} to apply",
          "ministry": scheme['ministry'] ?? 'Government of India',
          "description": scheme['description'] ?? '',
        };
      }).toList();

      setState(() {
        schemes = transformedSchemes;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.benefits),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? _buildErrorView()
              : _buildSchemesList(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppTheme.errorColor),
            const SizedBox(height: 16),
            const Text(
              'Failed to fetch schemes',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchEligibleSchemes,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSchemesList() {
    if (schemes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.inbox_outlined, size: 64, color: AppTheme.textSecondary),
              const SizedBox(height: 16),
              const Text(
                'No eligible schemes found',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Try adjusting your profile details',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
               BoxShadow(
                 color: Colors.black.withValues(alpha: 0.05),
                 blurRadius: 10,
                 offset: const Offset(0, 4),
               ),
            ],
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.secondaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: AppTheme.secondaryColor, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.resultsTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${AppLocalizations.of(context)!.resultsSubtitle} • ${schemes.length} ${AppLocalizations.of(context)!.schemes}",
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(20.0),
            itemCount: schemes.length,
            itemBuilder: (context, index) {
              final scheme = schemes[index];
              return _buildFloatingSchemeCard(scheme, context);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFloatingSchemeCard(Map<String, dynamic> scheme, BuildContext context) {
    final bool isEligible = scheme['eligible'];
    final Color statusColor = isEligible ? AppTheme.secondaryColor : AppTheme.errorColor;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 15,
            spreadRadius: 0,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => SchemeAssistantScreen(scheme: scheme),
              ),
            );
          },
          borderRadius: BorderRadius.circular(20),
          child: Column(
            children: [
              // Top Strip (Status Indicator)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.08),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      isEligible ? Icons.check_circle : Icons.cancel,
                      size: 18,
                      color: statusColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isEligible ? AppLocalizations.of(context)!.youQualify : "Not Eligible", 
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                    const Spacer(),
                    if (isEligible)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.auto_awesome, size: 12, color: statusColor),
                            const SizedBox(width: 4),
                            Text(
                              "AI Verified",
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: statusColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              
              // Main Body
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment. start,
                  children: [
                    Text(
                      scheme['name'],
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Divider(height: 1),
                    ),
                    _buildDetailRow(Icons.currency_rupee, AppLocalizations.of(context)!.benefits, scheme['benefit'], isHighlight: true),
                    const SizedBox(height: 12),
                    _buildDetailRow(Icons.info_outline, AppLocalizations.of(context)!.eligibility, scheme['reason']),
                    
                    if (isEligible) ...[
                       const SizedBox(height: 20),
                       Container(
                         width: double.infinity,
                         padding: const EdgeInsets.all(16),
                         decoration: BoxDecoration(
                           gradient: LinearGradient(
                             colors: [
                               const Color(0xFFE3F2FD),
                               const Color(0xFFE3F2FD).withValues(alpha: 0.5),
                             ],
                           ),
                           borderRadius: BorderRadius.circular(12),
                           border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
                         ),
                         child: Column(
                           crossAxisAlignment: CrossAxisAlignment.start,
                           children: [
                             Text(
                               "Next Step",
                               style: TextStyle(
                                 fontSize: 12,
                                 fontWeight: FontWeight.bold,
                                 color: Colors.blue.shade900,
                                 letterSpacing: 0.5,
                               ),
                             ),
                             const SizedBox(height: 4),
                             Row(
                               crossAxisAlignment: CrossAxisAlignment.start,
                               children: [
                                 Expanded(
                                   child: Text(
                                     scheme['next_step'],
                                     style: TextStyle(
                                       fontSize: 14,
                                       color: Colors.blue.shade800,
                                       height: 1.3,
                                     ),
                                   ),
                                 ),
                                 Icon(Icons.arrow_forward_ios, size: 14, color: Colors.blue.shade800),
                               ],
                             ),
                           ],
                         ),
                       ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {bool isHighlight = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: AppTheme.textSecondary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 14,
                  fontWeight: isHighlight ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
