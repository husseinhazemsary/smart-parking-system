// Add Card screen — collects card number, expiry, CVV and name.
// Auto-pay settings (default + backup) use plain background boxes with no border.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_colors.dart';

class AddCardScreen extends StatefulWidget {
  const AddCardScreen({super.key});

  @override
  State<AddCardScreen> createState() => _AddCardScreenState();
}

class _AddCardScreenState extends State<AddCardScreen> {
  // Text controllers for each card input field.
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _nameController = TextEditingController();

  // Tracks auto-pay preference toggles.
  bool _setAsDefault = true;
  bool _useAsBackup = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor:
      isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [

            Padding(
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(Icons.arrow_back, color: textPrimary),
                  ),
                  Text(
                    'Add new card',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        color: AppColors.purple,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    _FieldLabel('Card Number', textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _cardNumberController,
                        // Numeric-only input formatted as groups of 4 digits (e.g. 1234 5678 9012 3456).
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          _CardNumberFormatter(),
                        ],
                        decoration: InputDecoration(
                          hintText: '0000 0000 0000 0000',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          suffixIcon: Icon(
                            Icons.credit_card_outlined,
                            color: textSecondary,
                            size: 20,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _FieldLabel('Expiry Date',
                                  textColor: textPrimary),
                              const SizedBox(height: 8),
                              _GradientFieldBox(
                                child: TextFormField(
                                  controller: _expiryController,
                                  // Auto-formats input as MM / YY as the user types.
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    _ExpiryFormatter(),
                                  ],
                                  decoration: const InputDecoration(
                                    hintText: 'MM / YY',
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    filled: true,
                                    fillColor: Colors.transparent,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _FieldLabel('CVC / CVV',
                                  textColor: textPrimary),
                              const SizedBox(height: 8),
                              _GradientFieldBox(
                                child: TextFormField(
                                  controller: _cvvController,
                                  keyboardType: TextInputType.number,
                                  // CVV is masked for security.
                                  obscureText: true,
                                  maxLength: 4,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  decoration: const InputDecoration(
                                    hintText: '123',
                                    counterText: '',
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    filled: true,
                                    fillColor: Colors.transparent,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel('Name on card', textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _nameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          hintText: 'John Doe',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    Divider(
                      color: isDark
                          ? AppColors.borderDark
                          : AppColors.borderLight,
                    ),

                    const SizedBox(height: 16),

                    Text(
                      'AUTO-PAY SETTINGS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.2,
                        color: textSecondary,
                      ),
                    ),

                    const SizedBox(height: 16),

                    _PlainBox(
                      child: _CheckboxRow(
                        isDark: isDark,
                        value: _setAsDefault,
                        label: 'Set as default Auto-Pay card',
                        onChanged: (v) =>
                            setState(() => _setAsDefault = v ?? false),
                        textColor: textPrimary,
                      ),
                    ),

                    const SizedBox(height: 12),

                    _PlainBox(
                      child: _CheckboxRow(
                        isDark: isDark,
                        value: _useAsBackup,
                        label: 'Use as backup payment method',
                        onChanged: (v) =>
                            setState(() => _useAsBackup = v ?? false),
                        textColor: textPrimary,
                      ),
                    ),

                    const SizedBox(height: 24),

                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.lock_outline,
                              size: 14, color: textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            'Your info is encrypted and stored securely',
                            style: TextStyle(
                                color: textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Save Card'),
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

// Bold label rendered above each input field.
class _FieldLabel extends StatelessWidget {
  final String text;
  final Color textColor;
  const _FieldLabel(this.text, {required this.textColor});

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      fontWeight: FontWeight.w600,
      fontSize: 14,
      color: textColor,
    ),
  );
}

// Checkbox + label row used for auto-pay preference options.
class _CheckboxRow extends StatelessWidget {
  final bool isDark;
  final bool value;
  final String label;
  final ValueChanged<bool?> onChanged;
  final Color textColor;

  const _CheckboxRow({
    required this.isDark,
    required this.value,
    required this.label,
    required this.onChanged,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

// Inserts a space every 4 digits and caps input at 16 digits.
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(' ', '');
    if (digits.length > 16) return oldValue;
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

// Formats expiry as MM / YY and caps input at 4 digits.
class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll('/', '').replaceAll(' ', '');
    if (digits.length > 4) return oldValue;
    String formatted = digits;
    if (digits.length >= 3) {
      formatted = '${digits.substring(0, 2)} / ${digits.substring(2)}';
    } else if (digits.length == 2 && oldValue.text.length == 1) {
      formatted = '$digits / ';
    }
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

// Wraps card input fields with a #000011 @ 30% background and left→right gradient border.
class _GradientFieldBox extends StatelessWidget {
  final Widget child;
  const _GradientFieldBox({required this.child});
  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFF7D39EB),
      Color(0xFF0A0320),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _GradientBorderPainter(
        gradient: _gradient,
        borderWidth: 1.5,
        radius: 12,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0x4D000011),
          borderRadius: BorderRadius.circular(12),
        ),
        child: child,
      ),
    );
  }
}

// Plain container for checkbox rows — same #000011 @ 30% bg but no border.
class _PlainBox extends StatelessWidget {
  final Widget child;
  const _PlainBox({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0x4D000011),
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

// Paints a rounded-rect stroke using a LinearGradient shader.
// Required because BoxDecoration does not support gradient borders.
class _GradientBorderPainter extends CustomPainter {
  final LinearGradient gradient;
  final double borderWidth;
  final double radius;

  const _GradientBorderPainter({
    required this.gradient,
    required this.borderWidth,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    final paint = Paint()
      ..shader = gradient.createShader(rect)
      ..strokeWidth = borderWidth
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter old) =>
      old.gradient != gradient ||
          old.borderWidth != borderWidth ||
          old.radius != radius;
}