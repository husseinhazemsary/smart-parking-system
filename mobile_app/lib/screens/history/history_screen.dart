// History screen — paginated list of past parking sessions grouped by month.
// Supports filter chips: All, This Month, Last 3 Months, This Year.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

// Data model for a single parking session entry.
class _Session {
  final String location;
  final String date;
  final String duration;
  final String slot;
  final String amount;
  final String status; // 'completed' | 'cancelled'
  final String imageAsset;
  final double distanceKm;

  const _Session({
    required this.location,
    required this.date,
    required this.duration,
    required this.slot,
    required this.amount,
    required this.status,
    required this.imageAsset,
    required this.distanceKm,
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
        location: 'Arkan Mall Parking',
        date: 'Dec 24, 2:30 PM',
        duration: '2h 15m',
        slot: 'Slot A-42',
        amount: 'EGP 65',
        status: 'completed',
        imageAsset: 'assets/images/arkan.jpg',
        distanceKm: 0.5,
      ),
      _Session(
        location: 'Arkan Mall Parking',
        date: 'Dec 24, 2:30 PM',
        duration: '2h 15m',
        slot: 'Slot A-42',
        amount: 'EGP 65',
        status: 'completed',
        imageAsset: 'assets/images/arkan.jpg',
        distanceKm: 0.5,
      ),
    ]),
    _MonthGroup(label: 'NOVEMBER 2025', sessions: [
      _Session(
        location: 'Arkan Mall Parking',
        date: 'Nov 10, 2:30 PM',
        duration: '2h 15m',
        slot: 'Slot A-42',
        amount: 'EGP 65',
        status: 'cancelled',
        imageAsset: 'assets/images/arkan.jpg',
        distanceKm: 0.5,
      ),
      _Session(
        location: 'Arkan Mall Parking',
        date: 'Nov 5, 2:30 PM',
        duration: '2h 15m',
        slot: 'Slot A-42',
        amount: 'EGP 65',
        status: 'completed',
        imageAsset: 'assets/images/arkan.jpg',
        distanceKm: 0.5,
      ),
    ]),
  ];

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
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _allGroups.length,
                itemBuilder: (_, groupIndex) {
                  final group = _allGroups[groupIndex];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _MonthDivider(label: group.label, isDark: isDark),
                      const SizedBox(height: 12),
                      ...group.sessions.map((s) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _SessionCard(session: s, isDark: isDark),
                      )),
                      const SizedBox(height: 8),
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

// Card for a single session: thumbnail, info, status badge, receipt link.
class _SessionCard extends StatelessWidget {
  final _Session session;
  final bool isDark;
  const _SessionCard({required this.session, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final isCompleted = session.status == 'completed';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: Column(
        children: [
          // Upper section: thumbnail + session details + amount.
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail with a distance badge overlay.
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.asset(
                        session.imageAsset,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.purple.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.local_parking,
                              color: AppColors.purple, size: 32),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.65),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${session.distanceKm} km',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.location,
                          style: TextStyle(
                              color: textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 15)),
                      const SizedBox(height: 4),
                      Text('${session.date}  •  ${session.duration}',
                          style: TextStyle(color: textSecondary, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(session.slot,
                          style: TextStyle(color: textSecondary, fontSize: 12)),
                    ],
                  ),
                ),

                Text(session.amount,
                    style: TextStyle(
                        color: textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
              ],
            ),
          ),

          // Lower section: status badge + receipt action.
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border(
                  top: BorderSide(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight)),
            ),
            child: Row(
              children: [
                Container(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                        size: 14,
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
                    onTap: () {},
                    child: Row(
                      children: [
                        Text('View Receipt',
                            style: TextStyle(
                                color: AppColors.accentGreen,
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
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
          ),
        ],
      ),
    );
  }
}