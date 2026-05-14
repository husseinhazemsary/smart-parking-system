import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/user_provider.dart';
import '../../l10n/app_localizations.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  DateTime? _selectedDate;

  // Originals used by the Reset button to undo unsaved changes.
  late final String _originalName;
  late final String _originalPhone;
  late final DateTime? _originalDate;

  @override
  void initState() {
    super.initState();
    final profile = context.read<UserProvider>().profile;
    _originalName = profile?.fullName ?? '';
    _originalPhone = profile?.phoneNumber ?? '';
    _originalDate = profile?.dateOfBirth != null
        ? DateTime.tryParse(profile!.dateOfBirth!)
        : null;

    _nameController = TextEditingController(text: _originalName);
    _phoneController = TextEditingController(text: _originalPhone);
    _selectedDate = _originalDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _reset() {
    _nameController.text = _originalName;
    _phoneController.text = _originalPhone;
    setState(() => _selectedDate = _originalDate);
    _formKey.currentState?.reset();
  }

  String _dateDisplay(AppLocalizations l10n) {
    if (_selectedDate == null) return l10n.selectDateOfBirth;
    return '${_selectedDate!.year}-'
        '${_selectedDate!.month.toString().padLeft(2, '0')}-'
        '${_selectedDate!.day.toString().padLeft(2, '0')}';
  }

  String get _dateIso {
    if (_selectedDate == null) return '';
    return '${_selectedDate!.year}-'
        '${_selectedDate!.month.toString().padLeft(2, '0')}-'
        '${_selectedDate!.day.toString().padLeft(2, '0')}';
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(1995),
      firstDate: DateTime(1920),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 13)),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context)!;
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.dobRequired)),
      );
      return;
    }

    final userProvider = context.read<UserProvider>();
    final success = await userProvider.updateProfile(
      fullName: _nameController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      dateOfBirth: _dateIso,
    );

    if (!mounted) return;

    if (success) {
      final l10n2 = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n2.profileUpdatedSuccess)),
      );
      Navigator.of(context).pop();
    } else {
      final l10n2 = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(userProvider.error ?? l10n2.failedToUpdateProfile)),
      );
    }
  }

  // ── Validators ─────────────────────────────────────────────────────────────

  String? _validateName(String? v) {
    if (v == null || v.trim().isEmpty) return 'Full name is required.';
    final trimmed = v.trim();
    if (trimmed.length < 3) return 'Name is too short — keep typing.';
    final words =
        trimmed.split(RegExp(r'\s+')).where((s) => s.isNotEmpty).toList();
    if (words.length < 2) return 'Enter both your first and last name.';
    if (words.any((w) => w.length < 2)) {
      return 'Each part of your name must be at least 2 characters.';
    }
    return null;
  }

  String? _validatePhone(String? v) {
    if (v == null || v.trim().isEmpty) return 'Phone number is required.';

    // Strip formatting then normalise +20 → leading 0
    String cleaned = v.trim().replaceAll(RegExp(r'[\s\-()]'), '');
    if (cleaned.startsWith('+20')) cleaned = '0${cleaned.substring(3)}';

    final digits = cleaned.replaceAll(RegExp(r'\D'), '');
    const total = 11;

    // Prefix check kicks in once 3 digits are available
    if (digits.length >= 3) {
      const validPrefixes = ['010', '011', '012', '015'];
      if (!validPrefixes.contains(digits.substring(0, 3))) {
        return 'Phone must start with 010, 011, 012, or 015.';
      }
    }

    if (digits.length > total) {
      final n = digits.length - total;
      return '$n digit${n == 1 ? '' : 's'} too many — remove $n to continue.';
    }
    if (digits.length < total) {
      final n = total - digits.length;
      return '$n more digit${n == 1 ? '' : 's'} needed.';
    }

    return null;
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    final isLoading = context.watch<UserProvider>().isLoading;
    final bgColor =
        isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final inputFill = isDark ? AppColors.inputDark : AppColors.inputLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────────
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.surfaceDark
                            : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child:
                          Icon(Icons.arrow_back, size: 20, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    l10n.editProfile,
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: _reset,
                    icon: Icon(Icons.restart_alt,
                        size: 18, color: textSecondary),
                    label: Text(
                      l10n.reset,
                      style: TextStyle(
                        color: textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
            ),

            // ── Form ────────────────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Form(
                  key: _formKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      _label(l10n.fullName, textSecondary),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _nameController,
                        style: TextStyle(color: textPrimary),
                        textCapitalization: TextCapitalization.words,
                        decoration: _inputDecoration(
                          hint: l10n.firstAndLastNameHint,
                          fillColor: inputFill,
                          borderColor: borderColor,
                          textSecondary: textSecondary,
                        ),
                        validator: _validateName,
                      ),
                      const SizedBox(height: 20),
                      _label(l10n.phoneNumber, textSecondary),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: TextStyle(color: textPrimary),
                        decoration: _inputDecoration(
                          hint: '01X XXXX XXXX',
                          fillColor: inputFill,
                          borderColor: borderColor,
                          textSecondary: textSecondary,
                        ),
                        validator: _validatePhone,
                      ),
                      const SizedBox(height: 20),
                      _label(l10n.dateOfBirth, textSecondary),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: _pickDate,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 15),
                          decoration: BoxDecoration(
                            color: inputFill,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today_outlined,
                                  size: 18,
                                  color: _selectedDate == null
                                      ? textSecondary
                                      : textPrimary),
                              const SizedBox(width: 10),
                              Text(
                                _dateDisplay(l10n),
                                style: TextStyle(
                                  color: _selectedDate == null
                                      ? textSecondary
                                      : textPrimary,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 36),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _save,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.purple,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2.5),
                                )
                              : Text(
                                  l10n.saveChanges,
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600),
                                ),
                        ),
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

  Widget _label(String text, Color color) => Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: color,
          letterSpacing: 0.3,
        ),
      );

  InputDecoration _inputDecoration({
    required String hint,
    required Color fillColor,
    required Color borderColor,
    required Color textSecondary,
  }) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: textSecondary, fontSize: 14),
        filled: true,
        fillColor: fillColor,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      );
}
