import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'package:schemesathi/l10n/generated/app_localizations.dart';
import '../services/api_service.dart';

class SchemeAssistantScreen extends StatefulWidget {
  final Map<String, dynamic> scheme;

  const SchemeAssistantScreen({super.key, required this.scheme});

  @override
  State<SchemeAssistantScreen> createState() => _SchemeAssistantScreenState();
}

class _SchemeAssistantScreenState extends State<SchemeAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    // Initial greeting based on scheme
    _messages.add({
      'isUser': false,
      'text': "Hello! I am your assistant for **${widget.scheme['name']}**.\n\nI can help you check eligibility, gather documents, or guide you through the application process. What would you like to know?"
    });
  }

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({'isUser': true, 'text': text});
      _isTyping = true;
    });
    _controller.clear();
    _scrollToBottom();

    // Build history
    List<Map<String, String>> history = _messages.map((m) {
      return {
        'role': m['isUser'] == true ? 'user' : 'model',
        'content': (m['text'] ?? '').toString(),
      };
    }).toList();

    // Call API
    try {
      print("Chat scheme ID: ${widget.scheme['id']}"); // Debug log
      final response = await ApiService.chatWithBot(
        message: text,
        schemeId: widget.scheme['id'] ?? 'unknown_scheme', // Ensure ID is passed
        history: history,
      );

      if (!mounted) return;
      setState(() {
        _isTyping = false;
        _messages.add({
          'isUser': false,
          'text': response,
        });
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isTyping = false;
        _messages.add({
          'isUser': false,
          'text': "Sorry, I encountered an error: ${e.toString()}",
        });
      });
      _scrollToBottom();
    }
  }

  // Helper validation (not used for logic anymore)
  String _generateResponse(String userQuery) {
     return ""; // Deprecated
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEligible = widget.scheme['eligible'] == true;
    final statusColor = isEligible ? AppTheme.secondaryColor : AppTheme.errorColor;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.schemeAssistantTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(l10n.schemeAssistantSubtitle, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.primaryColor,
        elevation: 1,
      ),
      body: Column(
        children: [
          // 🔹 Top Section (Scheme Summary Card) - Flexible & Scrollable
          Container(
            constraints: const BoxConstraints(maxHeight: 200), // Limit height
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: SingleChildScrollView( // Make content scrollable
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.scheme['name'] ?? 'Scheme Name',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(child: _buildStatusChip(isEligible, statusColor, l10n)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.scheme['benefit'] ?? 'Benefits',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                            textAlign: TextAlign.end,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.scheme['description'] ?? 'No description available.',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),

          // 🔹 Chat Area
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return const Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text("Typing...", style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
                    ),
                  );
                }
                final msg = _messages[index];
                final isUser = msg['isUser'];
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isUser ? AppTheme.primaryColor : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: isUser ? const Radius.circular(16) : const Radius.circular(4),
                        bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(16),
                      ),
                      boxShadow: [
                        if (!isUser)
                          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: Text(
                      msg['text'],
                      style: TextStyle(
                         color: isUser ? Colors.white : AppTheme.textPrimary,
                         fontSize: 15,
                         height: 1.4,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // 🔹 Suggested Quick Actions
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildQuickAction(l10n.quickEligible),
                const SizedBox(width: 8),
                _buildQuickAction(l10n.quickDocs),
                const SizedBox(width: 8),
                _buildQuickAction(l10n.quickApply),
                const SizedBox(width: 8),
                _buildQuickAction(l10n.quickMistakes),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // 🔹 Input Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFEEEEEE))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: l10n.chatPlaceholder,
                      hintStyle: TextStyle(color: Colors.grey.shade400),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF5F7FA),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    onPressed: () => _sendMessage(_controller.text),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(bool isEligible, Color color, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isEligible ? Icons.check_circle : Icons.cancel, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            isEligible ? l10n.youQualify : "Not Eligible",
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(String label) {
    return ActionChip(
      label: Text(label),
      backgroundColor: Colors.white,
      side: BorderSide(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
      labelStyle: const TextStyle(color: AppTheme.primaryColor, fontSize: 13, fontWeight: FontWeight.w600),
      onPressed: () => _sendMessage(label),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    );
  }
}
