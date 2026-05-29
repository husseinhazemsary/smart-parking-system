import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/auth_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/otp_input.dart';
import '../navigation/app_navigator.dart';
import 'login_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  const VerifyEmailScreen({super.key, required this.email});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  String _code = '';
  String? _error;
  bool _isLoading = false;
  bool _isResending = false;
  bool _resendSent = false;

  Future<void> _verify() async {
    if (_code.length < 6) {
      setState(() => _error = 'Enter the full 6-digit code.');
      return;
    }
    setState(() { _isLoading = true; _error = null; });
    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyEmail(widget.email, _code);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const AppNavigator()),
        (route) => false,
      );
    } else {
      setState(() { _isLoading = false; _error = auth.error ?? 'Invalid code. Please try again.'; });
    }
  }

  Future<void> _resend() async {
    setState(() { _isResending = true; _resendSent = false; });
    try {
      await AuthService.resendVerification(widget.email);
    } catch (_) {
      // Always show success — don't reveal whether email is registered
    }
    if (!mounted) return;
    setState(() { _isResending = false; _resendSent = true; });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final bgColor = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 60),

              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.purple.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.mark_email_unread_outlined,
                  color: AppColors.purple,
                  size: 44,
                ),
              ),

              const SizedBox(height: 28),

              Text(
                'Verify your email',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),

              const SizedBox(height: 10),

              Text(
                'Enter the 6-digit code sent to',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: textSecondary, height: 1.6),
              ),
              const SizedBox(height: 4),
              Text(
                widget.email,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.purple,
                ),
              ),

              const SizedBox(height: 32),

              OtpInput(
                onChanged: (val) => setState(() { _code = val; _error = null; }),
              ),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                ),
              ],

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.purple,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Verify Email',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),

              const SizedBox(height: 20),

              if (_resendSent)
                Text(
                  'A new code has been sent.',
                  style: TextStyle(
                    color: Colors.green.shade400,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                )
              else
                TextButton(
                  onPressed: _isResending ? null : _resend,
                  child: Text(
                    _isResending ? 'Sending…' : 'Resend Code',
                    style: const TextStyle(
                      color: AppColors.purple,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

              TextButton(
                onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                ),
                child: Text(
                  'Back to Log In',
                  style: TextStyle(
                    color: textSecondary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
