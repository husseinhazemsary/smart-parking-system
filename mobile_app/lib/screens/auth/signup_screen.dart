import 'package:flutter/material.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';
import '../navigation/app_navigator.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _consentChecked = false;
  DateTime? _selectedDate;
  bool _dobTouched = false;
  bool _consentTouched = false;
  String? _serverError;

  static final _emailRegex = RegExp(r'^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$');
  static final _phoneRegex = RegExp(r'^\+?[0-9]{7,15}$');

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_clearServerError);
    _emailController.addListener(_clearServerError);
    _phoneController.addListener(_clearServerError);
    _passwordController.addListener(_clearServerError);
  }

  void _clearServerError() {
    if (_serverError != null) setState(() => _serverError = null);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    setState(() => _dobTouched = true);
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
    if (picked != null) {
      _selectedDate = picked;
      setState(() {
        _dobController.text =
            '${picked.day}/${picked.month}/${picked.year}';
      });
    }
  }

  Future<void> _register() async {
    setState(() {
      _dobTouched = true;
      _consentTouched = true;
    });

    final formValid = _formKey.currentState!.validate();
    final dobValid = _selectedDate != null;
    final consentValid = _consentChecked;

    if (!formValid || !dobValid || !consentValid) return;

    final dob =
        '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}';

    final auth = context.read<AuthProvider>();
    final success = await auth.register(
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      dateOfBirth: dob,
      password: _passwordController.text,
    );

    if (!mounted) return;
    if (success) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AppNavigator()),
      );
    } else {
      setState(() => _serverError = auth.error ?? 'Registration failed. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
    final colorScheme = Theme.of(context).colorScheme;
    final isLoading = context.watch<AuthProvider>().isLoading;

    final dobError = _dobTouched && _selectedDate == null ? 'Date of birth is required.' : null;
    final consentError = _consentTouched && !_consentChecked
        ? 'You must accept the notification consent to continue.'
        : null;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [

            Directionality(
              textDirection: TextDirection.ltr,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        child: Icon(Icons.arrow_back, size: 20, color: colorScheme.onSurface),
                      ),
                    ),
                    const Spacer(),
                    _LangToggle(localeProvider: localeProvider, isDark: isDark),
                    const SizedBox(width: 10),
                    _ThemeToggle(themeProvider: themeProvider, isDark: isDark),
                  ],
                ),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      const SizedBox(height: 16),

                      Container(
                        height: 40,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : const Color(0xFFF0EEF6),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : const Color(0xFFD8D0F0),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _AuthTabButton(
                                label: l10n.logIn,
                                isActive: false,
                                isDark: isDark,
                                onTap: () => Navigator.of(context).pushReplacement(
                                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                                ),
                              ),
                            ),
                            Expanded(
                              child: _AuthTabButton(
                                label: l10n.signUp,
                                isActive: true,
                                isDark: isDark,
                                onTap: null,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      Text(
                        l10n.createAccount,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onSurface,
                        ),
                      ),

                      const SizedBox(height: 28),

                      _FieldLabel(l10n.fullName, isDark: isDark),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _nameController,
                        textCapitalization: TextCapitalization.words,
                        enabled: !isLoading,
                        decoration: InputDecoration(hintText: l10n.fullNameHint),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Full name is required.';
                          if (v.trim().length < 2) return 'Name must be at least 2 characters.';
                          return null;
                        },
                      ),

                      const SizedBox(height: 20),

                      _FieldLabel(l10n.email, isDark: isDark),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        enabled: !isLoading,
                        decoration: InputDecoration(hintText: l10n.emailHint),
                        validator: (v) {
                          final val = v?.trim() ?? '';
                          if (val.isEmpty) return 'Email is required.';
                          if (!_emailRegex.hasMatch(val)) return 'Enter a valid email address.';
                          return null;
                        },
                      ),

                      const SizedBox(height: 20),

                      _FieldLabel(l10n.phoneNumber, isDark: isDark),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        enabled: !isLoading,
                        decoration: InputDecoration(hintText: l10n.phoneHint),
                        validator: (v) {
                          final val = v?.trim() ?? '';
                          if (val.isEmpty) return 'Phone number is required.';
                          if (!_phoneRegex.hasMatch(val)) return 'Enter a valid phone number.';
                          return null;
                        },
                      ),

                      const SizedBox(height: 20),

                      _FieldLabel(l10n.dateOfBirth, isDark: isDark),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: isLoading ? null : () => _selectDate(context),
                        child: AbsorbPointer(
                          child: TextFormField(
                            controller: _dobController,
                            readOnly: true,
                            decoration: InputDecoration(
                              hintText: l10n.dobHint,
                              suffixIcon: const Icon(
                                Icons.calendar_today_outlined,
                                color: AppColors.textHintDark,
                                size: 20,
                              ),
                              // Show red border when touched but no date selected.
                              enabledBorder: dobError != null
                                  ? OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.redAccent),
                                    )
                                  : null,
                            ),
                          ),
                        ),
                      ),
                      if (dobError != null) _InlineError(dobError),

                      const SizedBox(height: 20),

                      _FieldLabel(l10n.password, isDark: isDark),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        enabled: !isLoading,
                        decoration: InputDecoration(
                          hintText: l10n.passwordHint,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppColors.textHintDark,
                            ),
                            onPressed: () =>
                                setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Password is required.';
                          if (v.length < 8) return 'Password must be at least 8 characters.';
                          return null;
                        },
                      ),

                      const SizedBox(height: 20),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: _consentChecked,
                            onChanged: isLoading
                                ? null
                                : (v) => setState(() {
                                      _consentChecked = v ?? false;
                                      _consentTouched = true;
                                    }),
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
                      if (consentError != null) _InlineError(consentError),

                      // Server error banner.
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: _serverError != null
                            ? Padding(
                                key: const ValueKey('error'),
                                padding: const EdgeInsets.only(top: 16),
                                child: _ErrorBanner(message: _serverError!, isDark: isDark),
                              )
                            : const SizedBox.shrink(key: ValueKey('empty')),
                      ),

                      const SizedBox(height: 24),

                      ElevatedButton(
                        onPressed: isLoading ? null : _register,
                        child: isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(l10n.createAccount),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Small red text shown directly below a field with an error.
class _InlineError extends StatelessWidget {
  final String message;
  const _InlineError(this.message);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6, left: 4),
      child: Text(
        message,
        style: const TextStyle(color: Colors.redAccent, fontSize: 12),
      ),
    );
  }
}

// Red banner shown above the submit button for server-side errors.
class _ErrorBanner extends StatelessWidget {
  final String message;
  final bool isDark;
  const _ErrorBanner({required this.message, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: isDark ? 0.12 : 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Colors.redAccent,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

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

class _LangToggle extends StatelessWidget {
  final LocaleProvider localeProvider;
  final bool isDark;
  const _LangToggle({required this.localeProvider, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final isArabic = localeProvider.isArabic;
    final inactiveColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Container(
      height: 34,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
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
                  color: !isArabic ? Colors.white : inactiveColor,
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
                  color: isArabic ? Colors.white : inactiveColor,
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

class _ThemeToggle extends StatelessWidget {
  final ThemeProvider themeProvider;
  final bool isDark;
  const _ThemeToggle({required this.themeProvider, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: themeProvider.toggleTheme,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Icon(
          isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round,
          color: isDark ? Colors.white : AppColors.textSecondaryLight,
          size: 18,
        ),
      ),
    );
  }
}

class _AuthTabButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  final VoidCallback? onTap;

  const _AuthTabButton({
    required this.label,
    required this.isActive,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? AppColors.purple : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive
                ? Colors.white
                : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
