import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class NavigationScreen extends StatelessWidget {
  final String destinationName;
  const NavigationScreen({super.key, required this.destinationName});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(
              painter: _NavMapPainter(
                baseColor: isDark ? const Color(0xFF0D1B2A) : const Color(0xFFEFF3F8),
                gridColor: isDark ? const Color(0xFF152535) : const Color(0xFFD6DEE9),
                blockColor: isDark ? const Color(0xFF0F2D1A) : const Color(0xFFDDEFE2),
                roadColor: isDark ? const Color(0xFF1C3550) : const Color(0xFFB7C7DB),
                routeColor: AppColors.purple,
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Row(
                children: [
                  _IconButton(
                    onTap: () => Navigator.of(context).pop(),
                    icon: Icons.arrow_back,
                    isDark: isDark,
                    border: border,
                    surface: surface,
                    iconColor: textPrimary,
                  ),
                  const Spacer(),
                  _IconButton(
                    onTap: () => Navigator.of(context).pop(),
                    icon: Icons.close,
                    isDark: isDark,
                    border: border,
                    surface: surface,
                    iconColor: textPrimary,
                  ),
                ],
              ),
            ),
          ),

          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 64, 16, 0),
                child: _RoutePill(
                  isDark: isDark,
                  surface: surface,
                  border: border,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  destinationName: destinationName,
                ),
              ),
            ),
          ),

          DraggableScrollableSheet(
            initialChildSize: 0.34,
            minChildSize: 0.28,
            maxChildSize: 0.60,
            snap: true,
            snapSizes: const [0.20, 0.30, 0.60],
            builder: (_, scrollController) {
              final bottomPad = MediaQuery.of(context).viewPadding.bottom + 20;

              return Container(
                decoration: BoxDecoration(
                  color: surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  border: Border(top: BorderSide(color: border)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.35 : 0.12),
                      blurRadius: 18,
                      offset: const Offset(0, -6),
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: EdgeInsets.fromLTRB(20, 10, 20, bottomPad),
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 18),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white24 : Colors.black12,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.backgroundDark : const Color(0xFFF1F3F7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: border),
                          ),
                          child: Icon(Icons.turn_right, color: textPrimary, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Turn right',
                                style: TextStyle(color: textPrimary, fontSize: 20, fontWeight: FontWeight.w700),
                              ),
                              Text('onto Main St', style: TextStyle(color: textSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                        Text('200 ft', style: TextStyle(color: textSecondary, fontSize: 14, fontWeight: FontWeight.w600)),
                      ],
                    ),

                    const SizedBox(height: 18),
                    Divider(color: border, height: 1),
                    const SizedBox(height: 16),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _StatBlock(
                          value: '12 min',
                          label: 'Fastest route',
                          valueColor: const Color(0xFF22C55E),
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(width: 18),
                        _StatBlock(
                          value: '3.2 mi',
                          label: 'Distance',
                          valueColor: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(width: 18),
                        _StatBlock(
                          value: '10:45 AM',
                          label: 'ETA',
                          valueColor: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const Spacer(),
                        ElevatedButton.icon(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close, size: 15),
                          label: const Text('End Trip'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7B1D1D),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                            textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),
                    Divider(color: border, height: 1),
                    const SizedBox(height: 16),

                    Text(
                      'Upcoming turns',
                      style: TextStyle(
                        color: isDark ? Colors.white70 : Colors.black54,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _UpcomingTurn(
                      icon: Icons.turn_left,
                      instruction: 'Turn left',
                      street: 'onto Ring Rd',
                      distance: '0.8 mi',
                      isDark: isDark,
                      surface: surface,
                      border: border,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                    ),
                    _UpcomingTurn(
                      icon: Icons.straight,
                      instruction: 'Continue straight',
                      street: 'on Desert Rd',
                      distance: '1.4 mi',
                      isDark: isDark,
                      surface: surface,
                      border: border,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                    ),
                    _UpcomingTurn(
                      icon: Icons.local_parking,
                      instruction: 'Arrive at destination',
                      street: destinationName,
                      distance: '',
                      isDark: isDark,
                      surface: surface,
                      border: border,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _IconButton extends StatelessWidget {
  final VoidCallback onTap;
  final IconData icon;
  final bool isDark;
  final Color border;
  final Color surface;
  final Color iconColor;

  const _IconButton({
    required this.onTap,
    required this.icon,
    required this.isDark,
    required this.border,
    required this.surface,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.25 : 0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }
}

class _RoutePill extends StatelessWidget {
  final bool isDark;
  final Color surface;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;
  final String destinationName;

  const _RoutePill({
    required this.isDark,
    required this.surface,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
    required this.destinationName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.25 : 0.10),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Your Location',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 10),
          Icon(Icons.arrow_forward, size: 16, color: textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              destinationName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle),
          ),
        ],
      ),
    );
  }
}

class _StatBlock extends StatelessWidget {
  final String value;
  final String label;
  final Color valueColor;
  final Color textSecondary;

  const _StatBlock({
    required this.value,
    required this.label,
    required this.valueColor,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: TextStyle(color: valueColor, fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _UpcomingTurn extends StatelessWidget {
  final IconData icon;
  final String instruction;
  final String street;
  final String distance;
  final bool isDark;
  final Color surface;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;

  const _UpcomingTurn({
    required this.icon,
    required this.instruction,
    required this.street,
    required this.distance,
    required this.isDark,
    required this.surface,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isDark ? AppColors.backgroundDark : const Color(0xFFF1F3F7),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: border),
            ),
            child: Icon(icon, color: textPrimary.withOpacity(0.8), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(instruction, style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                Text(street, style: TextStyle(color: textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          if (distance.isNotEmpty)
            Text(distance, style: TextStyle(color: textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _NavMapPainter extends CustomPainter {
  final Color baseColor;
  final Color gridColor;
  final Color blockColor;
  final Color roadColor;
  final Color routeColor;

  _NavMapPainter({
    required this.baseColor,
    required this.gridColor,
    required this.blockColor,
    required this.roadColor,
    required this.routeColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = baseColor);

    final gridPaint = Paint()..color = gridColor..strokeWidth = 1;
    for (double y = 0; y < size.height; y += 30) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    for (double x = 0; x < size.width; x += 30) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }

    final blockPaint = Paint()..color = blockColor;
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(20, 60, 80, 70), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width - 120, 40, 100, 80), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(30, size.height * 0.35, 90, 60), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width - 110, size.height * 0.3, 80, 70), const Radius.circular(8)), blockPaint);

    final roadPaint = Paint()..color = roadColor..strokeWidth = 10..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(0, size.height * 0.45), Offset(size.width, size.height * 0.45), roadPaint);
    canvas.drawLine(Offset(size.width * 0.4, 0), Offset(size.width * 0.4, size.height), roadPaint);
    canvas.drawLine(Offset(0, size.height * 0.7), Offset(size.width, size.height * 0.7), roadPaint);
    canvas.drawLine(Offset(size.width * 0.75, 0), Offset(size.width * 0.75, size.height), roadPaint);

    final routePaint = Paint()
      ..color = routeColor
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(0, size.height * 0.45)
      ..lineTo(size.width * 0.4, size.height * 0.45)
      ..lineTo(size.width * 0.4, size.height * 0.3)
      ..lineTo(size.width * 0.75, size.height * 0.3);

    canvas.drawPath(path, routePaint);
  }

  @override
  bool shouldRepaint(_NavMapPainter old) {
    return baseColor != old.baseColor ||
        gridColor != old.gridColor ||
        blockColor != old.blockColor ||
        roadColor != old.roadColor ||
        routeColor != old.routeColor;
  }
}