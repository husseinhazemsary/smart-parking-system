// History screen — paginated list of past parking sessions grouped by month.
// Supports filter chips: All, This Month, Last 3 Months, This Year.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

// Data model for a single parking session entry.
class _Session {
  final String id;
  final String location;
  final String address;
  final String date;
  final String duration;
  final String slot;
  final String amount;
  final String status; // 'completed' | 'cancelled'
  final String? imageAsset; // optional — falls back to P-badge if null or missing

  const _Session({
    required this.id,
    required this.location,
    required this.address,
    required this.date,
    required this.duration,
    required this.slot,
    required this.amount,
    required this.status,
    this.imageAsset,
  });
}

// Groups sessions under a month label for the list view.
class _MonthGroup {
  final String label;
  final List<_Session> sessions;
  const _MonthGroup({required this.label, required this.sessions});
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  // Active filter index — 0=All, 1=This Month, 2=Last 3 Months, 3=This Year.
  int _filterIndex = 0;

  final List<String> _filters = ['All', 'This Month', 'Last 3 Months', 'This Year'];

  // Sample data — replace with real API-fetched sessions.
  final List<_MonthGroup> _allGroups = const [
    _MonthGroup(label: 'DECEMBER 2025', sessions: [
      _Session(
        id: 'EZR-20251224-001',
        location: 'Arkan Mall Parking',
        address: '26th of July Corridor, Sheikh Zayed',
        date: 'Dec 24, 2:30 PM',
        duration: '2h 15m',
        slot: 'Slot A-42',
        amount: 'EGP 65',
        status: 'completed',
        imageAsset: 'assets/images/arkan.jpg',
      ),
      _Session(
        id: 'EZR-20251218-002',
        location: 'Cairo Festival City',
        address: 'New Cairo, Ring Road',
        date: 'Dec 18, 11:00 AM',
        duration: '3h 45m',
        slot: 'Slot C-07',
        amount: 'EGP 90',
        status: 'completed',
        imageAsset: 'assets/images/cairo_festival_city.jpg',
      ),
      _Session(
        id: 'EZR-20251210-003',
        location: 'Maadi Grand Mall',
        address: 'Road 9, Maadi, Cairo',
        date: 'Dec 10, 6:15 PM',
        duration: '1h 30m',
        slot: 'Slot B-12',
        amount: 'EGP 40',
        status: 'cancelled',
        imageAsset: 'assets/images/maadi_grand.jpg',
      ),
    ]),
    _MonthGroup(label: 'NOVEMBER 2025', sessions: [
      _Session(
        id: 'EZR-20251128-004',
        location: 'City Stars Parking',
        address: 'Omar Ibn El-Khattab, Nasr City',
        date: 'Nov 28, 4:00 PM',
        duration: '2h 00m',
        slot: 'Slot D-19',
        amount: 'EGP 55',
        status: 'completed',
        imageAsset: 'assets/images/city_stars.jpg',
      ),
      _Session(
        id: 'EZR-20251115-005',
        location: 'Dandy Mega Mall',
        address: 'Alexandria Desert Road, Giza',
        date: 'Nov 15, 1:45 PM',
        duration: '4h 00m',
        slot: 'Slot A-03',
        amount: 'EGP 100',
        status: 'completed',
        imageAsset: 'assets/images/dandy.jpg',
      ),
      _Session(
        id: 'EZR-20251105-006',
        location: 'Smart Village Hub',
        address: 'KM 28, Cairo-Alex Desert Road',
        date: 'Nov 5, 9:00 AM',
        duration: '8h 00m',
        slot: 'Slot E-31',
        amount: 'EGP 160',
        status: 'cancelled',
        // No imageAsset — will show P-badge fallback
      ),
    ]),
    _MonthGroup(label: 'OCTOBER 2025', sessions: [
      _Session(
        id: 'EZR-20251022-007',
        location: 'Point 90 Mall',
        address: 'South 90th St, New Cairo',
        date: 'Oct 22, 3:30 PM',
        duration: '1h 45m',
        slot: 'Slot B-28',
        amount: 'EGP 45',
        status: 'completed',
        imageAsset: 'assets/images/point90.jpg',
      ),
    ]),
  ];

  // Opens the receipt bottom sheet for a completed session.
  void _showReceiptSheet(BuildContext context, bool isDark, _Session session) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: divColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Header: receipt icon + title + receipt ID
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.receipt_long_outlined,
                        color: Color(0xFF22C55E), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Parking Receipt',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: textColor)),
                      const SizedBox(height: 2),
                      Text(session.id,
                          style: TextStyle(fontSize: 12, color: subColor)),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              _ReceiptRow(label: 'Location', value: session.location, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _ReceiptRow(label: 'Address', value: session.address, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _ReceiptRow(label: 'Date & Time', value: session.date, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _ReceiptRow(label: 'Duration', value: session.duration, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _ReceiptRow(label: 'Slot', value: session.slot, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),

              // Total — highlighted in green
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Paid',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: textColor)),
                  Text(session.amount,
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF22C55E))),
                ],
              ),

              const SizedBox(height: 28),

              // Download PDF button
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: AppColors.purple,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.download_outlined, color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Download PDF',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 15),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left-aligned title with a filter icon on the right.
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Parking History',
                      style: TextStyle(
                        color: textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Icon(Icons.tune, color: textPrimary, size: 22),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Horizontally scrollable filter chips.
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final active = _filterIndex == i;
                  return GestureDetector(
                    onTap: () => setState(() => _filterIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: active ? AppColors.purple : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: active
                              ? AppColors.purple
                              : isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _filters[i],
                        style: TextStyle(
                          color: active ? Colors.white : textSecondary,
                          fontSize: 13,
                          fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 16),

            // Session list grouped by month.
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                itemCount: _allGroups.length,
                itemBuilder: (_, groupIndex) {
                  final group = _allGroups[groupIndex];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _MonthDivider(label: group.label, isDark: isDark),
                      const SizedBox(height: 14),
                      ...group.sessions.map((s) => Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: _SessionCard(
                          session: s,
                          isDark: isDark,
                          onViewReceipt: () => _showReceiptSheet(context, isDark, s),
                        ),
                      )),
                      const SizedBox(height: 4),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Horizontal divider with a centred month/year label.
class _MonthDivider extends StatelessWidget {
  final String label;
  final bool isDark;
  const _MonthDivider({required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final lineColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Row(
      children: [
        Expanded(child: Divider(color: lineColor, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(label,
              style: TextStyle(color: textColor, fontSize: 11, letterSpacing: 1.1)),
        ),
        Expanded(child: Divider(color: lineColor, height: 1)),
      ],
    );
  }
}

// Card for a single parking session.
class _SessionCard extends StatelessWidget {
  final _Session session;
  final bool isDark;
  final VoidCallback onViewReceipt;
  const _SessionCard({
    required this.session,
    required this.isDark,
    required this.onViewReceipt,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final isCompleted = session.status == 'completed';

    const radius = 16.0;
    const borderWidth = 1.5;
    const gradient = LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [Color(0x887D39EB), Color(0x880A0320)],
    );

    return CustomPaint(
      painter: _GradientBorderPainter(
        gradient: gradient,
        borderWidth: borderWidth,
        radius: radius,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: (isDark ? AppColors.surfaceDark : AppColors.surfaceLight).withOpacity(0.35),
          borderRadius: BorderRadius.circular(radius),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: P-badge + location name + amount
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Place image, falling back to P-badge if no image is available.
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: session.imageAsset != null
                        ? Image.asset(
                      session.imageAsset!,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _PBadge(),
                    )
                        : _PBadge(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.location,
                          style: TextStyle(
                              color: textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 15),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          session.address,
                          style: TextStyle(color: textSecondary, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    session.amount,
                    style: TextStyle(
                        color: const Color(0xFFB2A8D2),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        decoration: isCompleted ? TextDecoration.none : TextDecoration.lineThrough,
                        decorationColor: Colors.redAccent,
                        decorationThickness: 2.0),
                  ),
                ],
              ),

              const SizedBox(height: 14),
              Divider(height: 1, color: divColor),
              const SizedBox(height: 12),

              // Meta row: date · duration · slot
              Row(
                children: [
                  _MetaChip(
                    icon: Icons.access_time_outlined,
                    label: session.date,
                    textColor: textSecondary,
                  ),
                  const SizedBox(width: 14),
                  _MetaChip(
                    icon: Icons.timelapse_outlined,
                    label: session.duration,
                    textColor: textSecondary,
                  ),
                  const SizedBox(width: 14),
                  _MetaChip(
                    icon: Icons.confirmation_number_outlined,
                    label: session.slot,
                    textColor: textSecondary,
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Bottom row: status badge + receipt action
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? const Color(0xFF22C55E).withOpacity(0.12)
                          : Colors.redAccent.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isCompleted
                              ? Icons.check_circle_outline
                              : Icons.cancel_outlined,
                          color: isCompleted
                              ? const Color(0xFF22C55E)
                              : Colors.redAccent,
                          size: 13,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isCompleted ? 'Completed' : 'Cancelled',
                          style: TextStyle(
                            color: isCompleted
                                ? const Color(0xFF22C55E)
                                : Colors.redAccent,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Receipt link only for completed sessions.
                  if (isCompleted)
                    GestureDetector(
                      onTap: onViewReceipt,
                      child: Row(
                        children: [
                          Text(
                            'View Receipt',
                            style: TextStyle(
                                color: AppColors.accentGreen,
                                fontSize: 13,
                                fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward,
                              color: AppColors.accentGreen, size: 14),
                        ],
                      ),
                    )
                  else
                    Text('No Receipt',
                        style: TextStyle(color: textSecondary, fontSize: 13)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Fallback badge shown when no place image is available.
class _PBadge extends StatelessWidget {
  const _PBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFF7D39EB).withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color(0xFF7D39EB).withOpacity(0.25),
          width: 1,
        ),
      ),
      child: const Center(
        child: Text(
          'P',
          style: TextStyle(
            color: Color(0xFF7D39EB),
            fontSize: 18,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
      ),
    );
  }
}

// Small inline meta item: icon + label.
class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color textColor;
  const _MetaChip({required this.icon, required this.label, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: textColor),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: textColor, fontSize: 11)),
      ],
    );
  }
}

// A single label/value row inside the receipt bottom sheet.
class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final Color textColor;
  final Color subColor;
  const _ReceiptRow({
    required this.label,
    required this.value,
    required this.textColor,
    required this.subColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: subColor)),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: textColor),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}

// Strokes a rounded-rect border with a LinearGradient shader.
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