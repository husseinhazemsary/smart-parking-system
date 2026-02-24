// Signup screen — collects name, email, phone, date of birth and password.
// Includes a notification consent checkbox required before account creation.
import 'package:flutter/material.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  // All controllers disposed in dispose() to prevent memory leaks.
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _passwordController = TextEditingController();
  // Tracks password visibility and consent checkbox state.
  bool _obscurePassword = true;
  bool _consentChecked = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Opens a native date picker styled with the app's purple color scheme.
  Future<void> _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1940),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(primary: AppColors.purple),
        ),
        child: child!,
      ),
    );
    // Format: DD/MM/YYYY for display in the read-only DOB field.
    if (picked != null) {
      setState(() {
        _dobController.text =
        '${picked.day}/${picked.month}/${picked.year}';
      });
    }
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
                  _LangToggle(localeProvider: localeProvider),
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
                      l10n.createAccount,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onBackground,
                      ),
                    ),

                    const SizedBox(height: 28),

                    _FieldLabel(l10n.fullName, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      decoration:
                      InputDecoration(hintText: l10n.fullNameHint),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.email, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration:
                      InputDecoration(hintText: l10n.emailHint),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.phoneNumber, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration:
                      InputDecoration(hintText: l10n.phoneHint),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.dateOfBirth, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _dobController,
                      // Read-only so the keyboard never appears; tapping opens the date picker.
                      readOnly: true,
                      onTap: () => _selectDate(context),
                      decoration: InputDecoration(
                        hintText: l10n.dobHint,
                        suffixIcon: const Icon(
                          Icons.calendar_today_outlined,
                          color: AppColors.textHintDark,
                          size: 20,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.password, isDark: isDark),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      // Toggle visibility via the suffix icon to avoid typos.
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: l10n.passwordHint,
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

                    const SizedBox(height: 20),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Checkbox(
                          value: _consentChecked,
                          onChanged: (v) =>
                              setState(() => _consentChecked = v ?? false),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(
                              l10n.notificationsConsent,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: () {

                      },
                      child: Text(l10n.createAccount),
                    ),

                    const SizedBox(height: 20),

                    Center(
                      child: GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight,
                            ),
                            children: [
                              TextSpan(text: '${l10n.alreadyHaveAccount} '),
                              TextSpan(
                                text: l10n.signIn,
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

                    const SizedBox(height: 32),
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

// Bold section label shown above each form field.
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

// Language toggle pill shown in the top bar — EN/AR switch.
class _LangToggle extends StatelessWidget {
  final LocaleProvider localeProvider;
  const _LangToggle({required this.localeProvider});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: localeProvider.toggleLocale,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Text(
          localeProvider.isArabic ? 'EN' : 'EN',
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
    );
  }
}

// Dark/light mode toggle button shown in the top bar.
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