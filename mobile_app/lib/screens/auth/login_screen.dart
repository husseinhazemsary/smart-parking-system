// Login screen — entry point for returning users.
// Supports email/password login, Google and Apple sign-in, and remember me.
import 'package:flutter/material.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';
import '../auth/signup_screen.dart';
import '../navigation/app_navigator.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Controllers are disposed in dispose() to avoid memory leaks.
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  // Tracks remember-me checkbox and password visibility toggle.
  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [

            Padding(
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _LangToggle(),
                  const SizedBox(width: 10),
                  _ThemeToggle(themeProvider: themeProvider),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.surfaceDark
                              : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isDark
                                ? AppColors.borderDark
                                : AppColors.borderLight,
                          ),
                        ),
                        child: Icon(Icons.arrow_back,
                            size: 20, color: colorScheme.onBackground),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Text(
                      l10n.welcomeBack,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onBackground,
                      ),
                    ),

                    const SizedBox(height: 28),

                    _FieldLabel(l10n.email, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                          hintText: l10n.emailHint),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.password, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: l10n.passwordHintLogin,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: AppColors.textHintDark,
                          ),
                          onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _rememberMe,
                              onChanged: (v) =>
                                  setState(() => _rememberMe = v ?? false),
                            ),
                            Text(l10n.rememberMe,
                                style: TextStyle(
                                    color: colorScheme.onBackground,
                                    fontSize: 13)),
                          ],
                        ),
                        GestureDetector(
                          onTap: () {

                          },
                          child: Text(
                            l10n.forgotPassword,
                            style: const TextStyle(
                              color: AppColors.purple,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    ElevatedButton(
                      // On success replace the login route so back button doesn't return here.
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const AppNavigator()),
                        );
                      },
                      child: Text(l10n.signIn),
                    ),

                    const SizedBox(height: 24),

                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: isDark
                                ? AppColors.borderDark
                                : AppColors.borderLight,
                          ),
                        ),
                        Padding(
                          padding:
                          const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            l10n.orContinueWith,
                            style: TextStyle(
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: isDark
                                ? AppColors.borderDark
                                : AppColors.borderLight,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: _SocialButton(
                            icon: _GoogleIcon(),
                            onTap: () {

                            },
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _SocialButton(
                            icon: const Icon(Icons.apple,
                                color: Colors.white, size: 26),
                            onTap: () {

                            },
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 28),

                    Center(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const SignupScreen()),
                          );
                        },
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight,
                            ),
                            children: [
                              TextSpan(text: '${l10n.noAccount} '),
                              TextSpan(
                                text: l10n.signUp,
                                style: const TextStyle(
                                  color: AppColors.purple,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Bold label displayed above each input field.
class _FieldLabel extends StatelessWidget {
  final String text;
  final bool isDark;
  const _FieldLabel(this.text, {required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 14,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      ),
    );
  }
}

// Bordered social login button (Google / Apple) with a centred icon.
class _SocialButton extends StatelessWidget {
  final Widget icon;
  final VoidCallback onTap;
  final bool isDark;
  const _SocialButton(
      {required this.icon, required this.onTap, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        child: Center(child: icon),
      ),
    );
  }
}

// Placeholder Google icon — replace with an SVG asset when available.
class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Text(
      'G',
      style: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        fontFamily: 'sans-serif',
      ),
    );
  }
}

// EN / AR pill toggle that rebuilds when LocaleProvider changes.
class _LangToggle extends StatelessWidget {
  const _LangToggle();

  @override
  Widget build(BuildContext context) {

    // Watch directly so this widget rebuilds on every locale change.
    final localeProvider = context.watch<LocaleProvider>();
    final isArabic = localeProvider.isArabic;

    return Container(
      height: 34,
      decoration: BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDark),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: isArabic ? localeProvider.toggleLocale : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 40,
              height: 34,
              decoration: BoxDecoration(
                color: !isArabic ? AppColors.purple : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: Text(
                'EN',
                style: TextStyle(
                  color: !isArabic ? Colors.white : AppColors.textSecondaryDark,
                  fontWeight: !isArabic ? FontWeight.w700 : FontWeight.w400,
                  fontSize: 13,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: isArabic ? null : localeProvider.toggleLocale,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 40,
              height: 34,
              decoration: BoxDecoration(
                color: isArabic ? AppColors.purple : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: Text(
                'AR',
                style: TextStyle(
                  color: isArabic ? Colors.white : AppColors.textSecondaryDark,
                  fontWeight: isArabic ? FontWeight.w700 : FontWeight.w400,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Sun / moon icon button that calls ThemeProvider.toggleTheme.
class _ThemeToggle extends StatelessWidget {
  final ThemeProvider themeProvider;
  const _ThemeToggle({required this.themeProvider});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: themeProvider.toggleTheme,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Icon(
          themeProvider.isDark
              ? Icons.wb_sunny_outlined
              : Icons.nightlight_round,
          color: Colors.white,
          size: 18,
        ),
      ),
    );
  }
}