import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/user_provider.dart';
import '../../widgets/otp_input.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // 0 = send code, 1 = enter code + new password, 2 = success
  int _step = 0;
  bool _isLoading = false;
  String? _error;

  String _code = '';
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _showNew = false;
  bool _showConfirm = false;

  @override
  void dispose() {
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendCode(String email) async {
    setState(() { _isLoading = true; _error = null; });
    try {
      await AuthService.forgotPassword(email);
    } catch (_) {
      // Always proceed — don't reveal whether email is registered
    }
    if (!mounted) return;
    setState(() { _isLoading = false; _step = 1; });
  }

  Future<void> _resetPassword(String email) async {
    final newPw = _newPasswordCtrl.text;
    final confirm = _confirmPasswordCtrl.text;

    if (_code.length < 6) {
      setState(() => _error = 'Enter the full 6-digit code.');
      return;
    }
    if (newPw.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    if (newPw != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() { _isLoading = true; _error = null; });
    try {
      await AuthService.resetPassword(email, _code, newPw);
      if (!mounted) return;
      setState(() { _isLoading = false; _step = 2; });
    } catch (e) {
      if (!mounted) return;
      String msg = 'Invalid or expired code. Please try again.';
      if (e is Exception) {
        final s = e.toString();
        if (s.contains('detail')) {
          final match = RegExp(r'"detail"\s*:\s*"([^"]+)"').firstMatch(s);
          if (match != null) msg = match.group(1)!;
        }
      }
      setState(() { _isLoading = false; _error = msg; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final email = context.watch<UserProvider>().profile?.email ?? '';
    final bgColor = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final surfaceColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Icon(Icons.arrow_back, size: 20, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Reset Password',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _step == 0
                    ? _StepSendCode(
                        email: email,
                        isLoading: _isLoading,
                        textSecondary: textSecondary,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onSend: () => _sendCode(email),
                      )
                    : _step == 1
                        ? _StepEnterCode(
                            email: email,
                            isLoading: _isLoading,
                            error: _error,
                            showNew: _showNew,
                            showConfirm: _showConfirm,
                            newPasswordCtrl: _newPasswordCtrl,
                            confirmPasswordCtrl: _confirmPasswordCtrl,
                            borderColor: borderColor,
                            surfaceColor: surfaceColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onCodeChanged: (v) => setState(() { _code = v; _error = null; }),
                            onToggleNew: () => setState(() => _showNew = !_showNew),
                            onToggleConfirm: () => setState(() => _showConfirm = !_showConfirm),
                            onSubmit: () => _resetPassword(email),
                            onBack: () => setState(() { _step = 0; _code = ''; _error = null; }),
                          )
                        : _StepSuccess(
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onBack: () => Navigator.of(context).pop(),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepSendCode extends StatelessWidget {
  final String email;
  final bool isLoading;
  final Color textSecondary;
  final Color surfaceColor;
  final Color borderColor;
  final Color textPrimary;
  final VoidCallback onSend;

  const _StepSendCode({
    required this.email,
    required this.isLoading,
    required this.textSecondary,
    required this.surfaceColor,
    required this.borderColor,
    required this.textPrimary,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.purple.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.purple.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: AppColors.purple, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "We'll send a 6-digit reset code to your registered email address.",
                  style: TextStyle(color: textSecondary, fontSize: 13, height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'SENDING TO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              Icon(Icons.email_outlined, color: textSecondary, size: 20),
              const SizedBox(width: 10),
              Text(
                email,
                style: TextStyle(
                  color: textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: isLoading ? null : onSend,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.purple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text(
                    'Send Reset Code',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
          ),
        ),
      ],
    );
  }
}

class _StepEnterCode extends StatelessWidget {
  final String email;
  final bool isLoading;
  final String? error;
  final bool showNew;
  final bool showConfirm;
  final TextEditingController newPasswordCtrl;
  final TextEditingController confirmPasswordCtrl;
  final Color borderColor;
  final Color surfaceColor;
  final Color textPrimary;
  final Color textSecondary;
  final void Function(String) onCodeChanged;
  final VoidCallback onToggleNew;
  final VoidCallback onToggleConfirm;
  final VoidCallback onSubmit;
  final VoidCallback onBack;

  const _StepEnterCode({
    required this.email,
    required this.isLoading,
    required this.error,
    required this.showNew,
    required this.showConfirm,
    required this.newPasswordCtrl,
    required this.confirmPasswordCtrl,
    required this.borderColor,
    required this.surfaceColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.onCodeChanged,
    required this.onToggleNew,
    required this.onToggleConfirm,
    required this.onSubmit,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Text(
          'Enter the 6-digit code sent to',
          style: TextStyle(fontSize: 14, color: textSecondary, height: 1.6),
        ),
        Text(
          email,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.purple,
          ),
        ),
        const SizedBox(height: 24),

        OtpInput(onChanged: onCodeChanged),

        const SizedBox(height: 28),

        Text(
          'NEW PASSWORD',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        _PasswordField(
          controller: newPasswordCtrl,
          hint: 'Min. 8 characters',
          show: showNew,
          onToggle: onToggleNew,
          borderColor: borderColor,
          surfaceColor: surfaceColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
        ),

        const SizedBox(height: 16),

        Text(
          'CONFIRM PASSWORD',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        _PasswordField(
          controller: confirmPasswordCtrl,
          hint: 'Re-enter password',
          show: showConfirm,
          onToggle: onToggleConfirm,
          borderColor: borderColor,
          surfaceColor: surfaceColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
        ),

        if (error != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.red.withValues(alpha: 0.25)),
            ),
            child: Text(
              error!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 13, height: 1.4),
            ),
          ),
        ],

        const SizedBox(height: 28),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: isLoading ? null : onSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.purple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text(
                    'Reset Password',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
          ),
        ),

        const SizedBox(height: 12),

        Center(
          child: TextButton(
            onPressed: onBack,
            child: Text(
              '← Back',
              style: TextStyle(color: textSecondary, fontSize: 14),
            ),
          ),
        ),

        const SizedBox(height: 24),
      ],
    );
  }
}

class _PasswordField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool show;
  final VoidCallback onToggle;
  final Color borderColor;
  final Color surfaceColor;
  final Color textPrimary;
  final Color textSecondary;

  const _PasswordField({
    required this.controller,
    required this.hint,
    required this.show,
    required this.onToggle,
    required this.borderColor,
    required this.surfaceColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: !show,
      style: TextStyle(color: textPrimary, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.6), fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        filled: true,
        fillColor: surfaceColor,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
        ),
        suffixIcon: IconButton(
          icon: Icon(
            show ? Icons.visibility_off_outlined : Icons.visibility_outlined,
            color: textSecondary,
            size: 20,
          ),
          onPressed: onToggle,
        ),
      ),
    );
  }
}

class _StepSuccess extends StatelessWidget {
  final Color textPrimary;
  final Color textSecondary;
  final VoidCallback onBack;

  const _StepSuccess({
    required this.textPrimary,
    required this.textSecondary,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 48),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_outline, color: Colors.green, size: 40),
          ),
          const SizedBox(height: 24),
          Text(
            'Password reset!',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Your password has been updated successfully.\nYou can now log in with your new password.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: textSecondary, height: 1.6),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onBack,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: const Text(
                'Back to Change Password',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
