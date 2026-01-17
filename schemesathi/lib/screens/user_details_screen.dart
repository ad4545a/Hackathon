import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/preferences_service.dart';
import 'package:schemesathi/l10n/generated/app_localizations.dart';
import '../theme/app_theme.dart';
import 'loading_screen.dart';
import 'language_selection_screen.dart';

class UserDetailsScreen extends StatefulWidget {
  const UserDetailsScreen({super.key});

  @override
  State<UserDetailsScreen> createState() => _UserDetailsScreenState();
}

class _UserDetailsScreenState extends State<UserDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _incomeController = TextEditingController();
  
  String? _selectedCaste;
  String? _selectedState;
  String? _selectedOccupation;

  final List<String> _castes = ['General', 'OBC', 'SC', 'ST', 'Other'];
  final List<String> _states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ]; 


  @override
  void dispose() {
    _ageController.dispose();
    _incomeController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      // Prepare user profile data
      final userProfile = {
        'age': int.parse(_ageController.text),
        'income': int.parse(_incomeController.text),
        'caste': _selectedCaste!,
        'occupation': _selectedOccupation!,
        'state': _selectedState!,
      };
      
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LoadingScreen(userProfile: userProfile),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                const Color(0xFF283593),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        toolbarHeight: 0, // Profile header handles visual top
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // 1. HERO SECTION
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primaryColor,
                            const Color(0xFF3949AB),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(32),
                          bottomRight: Radius.circular(32),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryColor.withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
                      child: Column(
                        children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.auto_awesome_motion,
                                    color: Colors.white,
                                    size: 32,
                                  ),
                                ),
                                IconButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: Text(AppLocalizations.of(context)!.userDetailsTitle),
                                        content: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            ListTile(
                                              leading: const Icon(Icons.language, color: AppTheme.primaryColor),
                                              title: Text(AppLocalizations.of(context)!.chooseLanguage),
                                              onTap: () {
                                                Navigator.pop(context);
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(builder: (context) => const LanguageSelectionScreen(fromSettings: true)),
                                                );
                                              },
                                            ),
                                            const Divider(),
                                            ListTile(
                                              leading: const Icon(Icons.logout, color: Colors.red),
                                              title: const Text("Logout", style: TextStyle(color: Colors.red)),
                                              onTap: () async {
                                                Navigator.pop(context);
                                                await PreferencesService.logout();
                                                if (!context.mounted) return;
                                                Navigator.of(context).pushAndRemoveUntil(
                                                  MaterialPageRoute(builder: (context) => const LanguageSelectionScreen()),
                                                  (route) => false,
                                                );
                                              },
                                            ),
                                          ],
                                        ),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      ),
                                    );
                                  },
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                                    ),
                                    child: const Icon(Icons.person, color: Colors.white, size: 20),
                                  ),
                                ),
                              ],
                            ),
                          const SizedBox(height: 16),
                          Text(
                            AppLocalizations.of(context)!.onboardingTitle1, // Reuse or add specific title
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            AppLocalizations.of(context)!.onboardingDesc1, // Reuse or add specific desc
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),
                    // QUALITY INFO CHIPS
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              _buildInfoChip(Icons.folder_open, AppLocalizations.of(context)!.chipSchemes),
                              const SizedBox(width: 8),
                              _buildInfoChip(Icons.verified, AppLocalizations.of(context)!.chipVerified),
                              const SizedBox(width: 8),
                              _buildInfoChip(Icons.account_balance, AppLocalizations.of(context)!.chipOfficial),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),

                    // 2. FORM SECTION
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Card(
                        elevation: 8,
                        shadowColor: Colors.black.withValues(alpha: 0.08),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        color: Colors.white,
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Container(width: 4, height: 24, color: AppTheme.secondaryColor, margin: const EdgeInsets.only(right: 8)),
                                    const Text("Personal Details", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                
                                // Row 1: Age & Income
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel(AppLocalizations.of(context)!.ageLabel),
                                          TextFormField(
                                            controller: _ageController,
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
                                            decoration: _buildInputDecoration(AppLocalizations.of(context)!.ageHint, Icons.person_outline),
                                            validator: (val) => val!.isEmpty ? 'Required' : null,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel(AppLocalizations.of(context)!.incomeLabel),
                                          TextFormField(
                                            controller: _incomeController,
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                            decoration: _buildInputDecoration(AppLocalizations.of(context)!.incomeHint, Icons.currency_rupee),
                                            validator: (val) => val!.isEmpty ? 'Required' : null,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),

                                // Row 2: Caste & State
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel(AppLocalizations.of(context)!.casteLabel),
                                          DropdownButtonFormField<String>(
                                            isExpanded: true, // Prevents overflow
                                            initialValue: _selectedCaste,
                                            decoration: _buildInputDecoration("Select", Icons.category_outlined),
                                            items: _castes.map((v) => DropdownMenuItem(value: v, child: Text(v, overflow: TextOverflow.ellipsis))).toList(),
                                            onChanged: (v) => setState(() => _selectedCaste = v),
                                            validator: (v) => v == null ? 'Required' : null,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildLabel(AppLocalizations.of(context)!.stateLabel),
                                          DropdownButtonFormField<String>(
                                            isExpanded: true,
                                            initialValue: _selectedState,
                                            decoration: _buildInputDecoration("Select", Icons.location_on_outlined),
                                            items: _states.map((v) => DropdownMenuItem(value: v, child: Text(v, overflow: TextOverflow.ellipsis))).toList(),
                                            onChanged: (v) => setState(() => _selectedState = v),
                                            validator: (v) => v == null ? 'Required' : null,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),

                                // Row 3: Occupation (Full Width)
                                _buildLabel(AppLocalizations.of(context)!.occupationLabel),
                                DropdownButtonFormField<String>(
                                  initialValue: _selectedOccupation,
                                  decoration: _buildInputDecoration(AppLocalizations.of(context)!.occupationLabel, Icons.work_outline), // reused label as hint or similar
                                  // Map internal values to Display values
                                  items: [
                                    {'val': 'Student', 'label': AppLocalizations.of(context)!.occStudent},
                                    {'val': 'Farmer', 'label': AppLocalizations.of(context)!.occFarmer},
                                    {'val': 'Daily Wage Worker', 'label': AppLocalizations.of(context)!.occDailyWage},
                                    {'val': 'Salaried', 'label': AppLocalizations.of(context)!.occSalaried},
                                    {'val': 'Self-Employed', 'label': AppLocalizations.of(context)!.occSelfEmployed},
                                    {'val': 'Unemployed', 'label': AppLocalizations.of(context)!.occUnemployed},
                                    {'val': 'Retired', 'label': AppLocalizations.of(context)!.occRetired},
                                  ].map((item) => DropdownMenuItem(
                                    value: item['val'] as String, 
                                    child: Text(item['label'] as String)
                                  )).toList(),
                                  onChanged: (v) => setState(() => _selectedOccupation = v),
                                  validator: (v) => v == null ? 'Required' : null,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 24),

                    // 3. TRUST STRIP
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9), 
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        children: [
                          _buildTrustItem(AppLocalizations.of(context)!.trustOfficial),
                          const SizedBox(height: 6),
                          _buildTrustItem(AppLocalizations.of(context)!.trustLogin),
                          const SizedBox(height: 6),
                          _buildTrustItem(AppLocalizations.of(context)!.trustSecure),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32), // Spacer for scrolling
                  ],
                ),
              ),
            ),
            
            // 4. BOTTOM CTA PANEL
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "Takes less than 10 seconds",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 54,
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitForm,
                        child: Text(AppLocalizations.of(context)!.findMyBenefits),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      AppLocalizations.of(context)!.microAi,
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[500],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppTheme.textSecondary),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustItem(String text) {
    return Row(
      children: [
        const Icon(Icons.check_circle, size: 16, color: AppTheme.secondaryColor),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryColor.withValues(alpha: 0.8)),
        ),
      ],
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: AppTheme.textPrimary.withValues(alpha: 0.8),
        ),
      ),
    );
  }
  
  InputDecoration _buildInputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: Colors.blueGrey, size: 20),
      fillColor: const Color(0xFFF8F9FA),
      filled: true,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade200, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
      ),
    );
  }
}
