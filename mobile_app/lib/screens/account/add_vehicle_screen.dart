// Add Vehicle screen — collects plate number, nickname, type and make/model.
// Includes toggles for default vehicle and auto-pay settings.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class AddVehicleScreen extends StatefulWidget {
  const AddVehicleScreen({super.key});

  @override
  State<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  // Text controllers for each input field.
  final _plateController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _makeController = TextEditingController();

  // Tracks which vehicle type chip is active.
  String _selectedType = 'Sedan';
  // Toggle states for default vehicle and auto-pay.
  bool _setAsDefault = true;
  bool _autoPay = true;

  // EV detection — true when the entered make/model matches a known EV brand or model.
  bool _isEV = false;

  // Vehicle type options shown as selectable chips.
  final List<Map<String, dynamic>> _vehicleTypes = [
    {'label': 'Sedan', 'icon': Icons.directions_car},
    {'label': 'SUV', 'icon': Icons.directions_car_filled},
    {'label': 'Truck', 'icon': Icons.local_shipping},
  ];

  // Known EV brands/models. Matched case-insensitively against the make & model text.
  static const _evKeywords = [
    'tesla', 'rivian', 'lucid', 'polestar', 'nio', 'fisker', 'canoo',
    'byd', 'xpeng', 'li auto', 'zeekr',
    'nissan leaf', 'bolt', 'chevrolet bolt',
    'ioniq 5', 'ioniq 6', 'ioniq5', 'ioniq6', 'kia ev6', 'kia ev',
    'bmw i3', 'bmw i4', 'bmw ix', 'bmw i5', 'bmw i7',
    'mercedes eqs', 'mercedes eqe', 'mercedes eqa', 'mercedes eqb', 'mercedes eqc',
    'eqs', 'eqe', 'eqa', 'eqb', 'eqc',
    'audi e-tron', 'audi etron', 'audi q4 e-tron',
    'porsche taycan',
    'volkswagen id', 'vw id', 'id.3', 'id.4', 'id.5', 'id.7',
    'volvo ex30', 'volvo ex40', 'volvo ec40', 'volvo c40',
    'ford mustang mach-e', 'ford mach-e', 'ford f-150 lightning', 'f-150 lightning',
    'gmc hummer ev', 'hummer ev',
    'mini cooper se', 'mini se',
    'jaguar i-pace', 'i-pace',
    'hyundai ioniq',
  ];

  /// Auto-detects EV status from the typed make & model string.
  void _detectEV(String text) {
    final lower = text.toLowerCase();
    final detected = _evKeywords.any((kw) => lower.contains(kw));
    if (detected != _isEV) setState(() => _isEV = detected);
  }

  @override
  void dispose() {
    _plateController.dispose();
    _nicknameController.dispose();
    _makeController.dispose();
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
                    'Add Vehicle',
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
                        color: AppColors.accentGreen,
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

                    Center(
                      child: Text(
                        'Used for entry/exit recognition and Auto-Pay.',
                        style: TextStyle(
                            color: textSecondary, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const SizedBox(height: 24),

                    _FieldLabel('License Plate Number',
                        textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _plateController,
                        decoration: const InputDecoration(
                          hintText: 'ABC   1234',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        _FieldLabel('Vehicle Nickname',
                            textColor: textPrimary),
                        const SizedBox(width: 6),
                        Text(
                          '(Optional)',
                          style: TextStyle(
                              color: textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _nicknameController,
                        decoration: const InputDecoration(
                          hintText: 'Daily Driver',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel('Vehicle Type', textColor: textPrimary),
                    const SizedBox(height: 12),
                    Row(
                      children: _vehicleTypes.map((type) {
                        final isSelected = _selectedType == type['label'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: GestureDetector(
                            onTap: () => setState(
                                    () => _selectedType = type['label']),
                            child: _GradientChipBox(
                              isSelected: isSelected,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.purple
                                      : const Color(0x4D000011),
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      type['icon'] as IconData,
                                      size: 16,
                                      color: isSelected
                                          ? Colors.white
                                          : textSecondary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      type['label'] as String,
                                      style: TextStyle(
                                        color: isSelected
                                            ? Colors.white
                                            : textSecondary,
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel('Make & Model', textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _makeController,
                        onChanged: _detectEV,
                        decoration: InputDecoration(
                          hintText: 'e.g. Toyota Corolla, Tesla Model 3...',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          suffixIcon: Icon(Icons.search,
                              color: textSecondary, size: 20),
                        ),
                      ),
                    ),

                    // EV status — auto-detected from make & model, or toggled manually.
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0x4D000011),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: _isEV
                                  ? const Color(0xFF22C55E).withOpacity(0.15)
                                  : AppColors.purple.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.electric_bolt,
                              color: _isEV
                                  ? const Color(0xFF22C55E)
                                  : textSecondary,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Electric Vehicle (EV)',
                                  style: TextStyle(
                                    color: textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _isEV
                                      ? 'Auto-detected from make & model'
                                      : 'Not detected — toggle on if this is an EV',
                                  style: TextStyle(
                                    color: _isEV
                                        ? const Color(0xFF22C55E)
                                        : textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _isEV,
                            onChanged: (v) => setState(() => _isEV = v),
                            activeColor: Colors.white,
                            activeTrackColor: const Color(0xFF22C55E),
                            inactiveThumbColor: Colors.white,
                            inactiveTrackColor:
                                isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    _ToggleRow(
                      isDark: isDark,
                      label: 'Set as default vehicle',
                      value: _setAsDefault,
                      onChanged: (v) => setState(() => _setAsDefault = v),
                      textColor: textPrimary,
                    ),

                    const SizedBox(height: 4),

                    Container(
                      decoration: const BoxDecoration(
                        color: Color(0x4D000011),
                        borderRadius: BorderRadius.all(Radius.circular(14)),
                      ),
                      child: Column(
                        children: [
                          _ToggleRow(
                            isDark: isDark,
                            label: 'Auto-Pay Settings',
                            value: _autoPay,
                            onChanged: (v) =>
                                setState(() => _autoPay = v),
                            textColor: textPrimary,
                            bold: true,
                            noBorder: true,
                          ),
                          if (_autoPay)
                            Padding(
                              padding: const EdgeInsets.fromLTRB(
                                  16, 0, 16, 14),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppColors.backgroundDark
                                      : AppColors.backgroundLight,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isDark
                                        ? AppColors.borderDark
                                        : AppColors.borderLight,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1A1A7E),
                                        borderRadius:
                                        BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'VISA',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Visa ending in 4242',
                                            style: TextStyle(
                                                color: textPrimary,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500),
                                          ),
                                          const SizedBox(height: 2),
                                          const Text(
                                            'Default',
                                            style: TextStyle(
                                              color: AppColors.accentGreen,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Text(
                                      'Change',
                                      style: TextStyle(
                                        color: AppColors.purple,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Save Vehicle'),
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

// Bold section label displayed above each input field.
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

// Toggle row used for Set as Default and Auto-Pay — #000011 bg, no border.
class _ToggleRow extends StatelessWidget {
  final bool isDark;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color textColor;
  final bool bold;
  final bool noBorder;

  const _ToggleRow({
    required this.isDark,
    required this.label,
    required this.value,
    required this.onChanged,
    required this.textColor,
    this.bold = false,
    this.noBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0x4D000011),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 15,
              fontWeight: bold ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.white,
            activeTrackColor: AppColors.purple,
            inactiveThumbColor: Colors.white,
            inactiveTrackColor:
            isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ],
      ),
    );
  }
}

// Wraps a TextFormField with a #000011 @ 30% background and a left→right gradient border.
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

// Wraps unselected vehicle type chips with the gradient border.
// Selected chips keep their solid purple fill and skip the border entirely.
class _GradientChipBox extends StatelessWidget {
  final bool isSelected;
  final Widget child;
  const _GradientChipBox({required this.isSelected, required this.child});

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
    // Skip painting the gradient border when the chip is selected (solid purple handles styling).
    if (isSelected) return child;
    return CustomPaint(
      painter: _GradientBorderPainter(
        gradient: _gradient,
        borderWidth: 1.5,
        radius: 24,
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

  _GradientBorderPainter({
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