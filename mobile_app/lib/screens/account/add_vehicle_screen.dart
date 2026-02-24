import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class AddVehicleScreen extends StatefulWidget {
  const AddVehicleScreen({super.key});

  @override
  State<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _plateController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _makeController = TextEditingController();

  String _selectedType = 'Sedan';
  bool _setAsDefault = true;
  bool _autoPay = true;

  final List<Map<String, dynamic>> _vehicleTypes = [
    {'label': 'Sedan', 'icon': Icons.directions_car},
    {'label': 'SUV', 'icon': Icons.directions_car_filled},
    {'label': 'Truck', 'icon': Icons.local_shipping},
  ];

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
            // Top bar
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
                    // Subtitle
                    Center(
                      child: Text(
                        'Used for entry/exit recognition and Auto-Pay.',
                        style: TextStyle(
                            color: textSecondary, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // License Plate
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

                    // Nickname
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

                    // Vehicle Type
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

                    // Make & Model
                    _FieldLabel('Make & Model', textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _makeController,
                        decoration: InputDecoration(
                          hintText: 'Search make...',
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

                    const SizedBox(height: 28),

                    // Set as default toggle
                    _ToggleRow(
                      isDark: isDark,
                      label: 'Set as default vehicle',
                      value: _setAsDefault,
                      onChanged: (v) => setState(() => _setAsDefault = v),
                      textColor: textPrimary,
                    ),

                    const SizedBox(height: 4),

                    // Auto-Pay Settings
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

                    // Save button
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

// ── Gradient border box for input fields ─────────────────────────────────────
class _GradientFieldBox extends StatelessWidget {
  final Widget child;
  const _GradientFieldBox({required this.child});

  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFF7D39EB), // left — bright purple
      Color(0xFF0A0320), // right — near-black dark
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

// ── Gradient border box for chip buttons (unselected only) ───────────────────
class _GradientChipBox extends StatelessWidget {
  final bool isSelected;
  final Widget child;
  const _GradientChipBox({required this.isSelected, required this.child});

  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFF7D39EB), // left — bright purple
      Color(0xFF0A0320), // right — near-black dark
    ],
  );

  @override
  Widget build(BuildContext context) {
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

// ── Gradient border painter ───────────────────────────────────────────────────
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