// Home screen — main dashboard shown after login.
// Displays: user greeting, search bar, active parking session timer,
// nearby parking cards, and a monthly snapshot summary.
import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../parking/select_location_screen.dart';
import '../parking/parking_details_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Active session elapsed time — ticks every second.
  Duration _elapsed = const Duration(hours: 1, minutes: 23, seconds: 45);
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Start ticking the elapsed session timer.
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsed += const Duration(seconds: 1));
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatElapsed(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  // Opens the active session detail bottom sheet.
  void _showActiveSessionSheet(BuildContext context, bool isDark) {
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
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: divColor, borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Header
              Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.purple.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.local_parking, color: AppColors.purple, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Mall of Egypt',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
                      const SizedBox(height: 2),
                      Text('El Wahat Rd, 6th of October',
                          style: TextStyle(fontSize: 12, color: subColor)),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Live timer row
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.purple.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Elapsed Time',
                            style: TextStyle(fontSize: 11, color: subColor)),
                        const SizedBox(height: 2),
                        StatefulBuilder(
                          builder: (_, __) => Text(
                            _formatElapsed(_elapsed),
                            style: const TextStyle(
                              color: AppColors.purple,
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Started at', style: TextStyle(fontSize: 11, color: subColor)),
                        const SizedBox(height: 2),
                        Text('09:30 PM',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textColor)),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Detail rows
              _SheetDetailRow(label: 'Slot', value: 'A2', icon: Icons.local_parking, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _SheetDetailRow(label: 'Level & Gate', value: 'Level C  •  Gate A', icon: Icons.layers_outlined, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _SheetDetailRow(label: 'Vehicle', value: 'Toyota Corolla  •  BG 4567', icon: Icons.directions_car_outlined, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Est. Cost', style: TextStyle(fontSize: 13, color: subColor)),
                  Text('EGP 50.00',
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF22C55E))),
                ],
              ),

              const SizedBox(height: 28),

              // End session button
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.stop_circle_outlined, color: Colors.redAccent, size: 20),
                      SizedBox(width: 8),
                      Text('End Session',
                          style: TextStyle(
                              color: Colors.redAccent,
                              fontWeight: FontWeight.w600,
                              fontSize: 15)),
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

  // Opens the saved / favourite locations bottom sheet.
  void _showSavedSheet(BuildContext context, bool isDark) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    // Sample saved locations — replace with real data.
    const saved = [
      ('Arkan Mall', 'Sheikh Zayed, Giza', '0.5 km'),
      ('Cairo Airport T2', 'Cairo International Airport', '1.2 km'),
      ('City Stars', 'Nasr City, Cairo', '3.4 km'),
    ];

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
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: divColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),
              Text('Saved Places',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 4),
              Text('Your favourite parking locations',
                  style: TextStyle(fontSize: 13, color: subColor)),
              const SizedBox(height: 20),
              ...saved.map((s) => Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEC4899).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.favorite, color: Color(0xFFEC4899), size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.$1,
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textColor)),
                            Text(s.$2,
                                style: TextStyle(fontSize: 12, color: subColor)),
                          ],
                        ),
                      ),
                      Text(s.$3, style: TextStyle(fontSize: 12, color: subColor)),
                    ],
                  ),
                  if (s != saved.last) Divider(height: 20, color: divColor),
                ],
              )),
            ],
          ),
        );
      },
    );
  }

  // Opens the notifications bottom sheet.
  void _showNotificationsSheet(BuildContext context, bool isDark) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    // Sample notifications — replace with real data.
    const notifications = [
      (Icons.access_time, Color(0xFF7D39EB), 'Session reminder', 'Your session at Mall of Egypt ends in 30 minutes.', '2m ago'),
      (Icons.local_offer_outlined, Color(0xFF22C55E), 'Promo available', 'Get 20% off your next booking at Arkan Mall.', '1h ago'),
      (Icons.receipt_long_outlined, Color(0xFF3B82F6), 'Receipt ready', 'Your receipt for Cairo Airport is ready to download.', 'Yesterday'),
    ];

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
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: divColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Notifications',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.purple.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('3 new',
                        style: TextStyle(color: AppColors.purple, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ...notifications.map((n) => Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: n.$2.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(n.$1, color: n.$2, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.$3,
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textColor)),
                            const SizedBox(height: 2),
                            Text(n.$4,
                                style: TextStyle(fontSize: 12, color: subColor),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(n.$5, style: TextStyle(fontSize: 11, color: subColor)),
                    ],
                  ),
                  if (n != notifications.last) Divider(height: 20, color: divColor),
                ],
              )),
            ],
          ),
        );
      },
    );
  }

  // Opens the monthly snapshot detail bottom sheet.
  void _showMonthlySnapshotSheet(BuildContext context, bool isDark) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    // Sample monthly breakdown — replace with real data.
    const breakdown = [
      ('Arkan Mall Parking', 'Dec 24', '2h 15m', 'EGP 65'),
      ('Cairo Festival City', 'Dec 18', '3h 45m', 'EGP 90'),
      ('City Stars Parking', 'Nov 28', '2h 00m', 'EGP 55'),
      ('Dandy Mega Mall', 'Nov 15', '4h 00m', 'EGP 100'),
    ];

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
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: divColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),

              // Header
              Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.purple.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.bar_chart_outlined, color: AppColors.purple, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Monthly Snapshot',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
                      const SizedBox(height: 2),
                      Text('December 2025',
                          style: TextStyle(fontSize: 12, color: subColor)),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Summary stat row
              Row(
                children: [
                  _SnapshotPill(label: 'Hours', value: '42h', icon: Icons.access_time_outlined),
                  const SizedBox(width: 10),
                  _SnapshotPill(label: 'Spent', value: 'EGP 300', icon: Icons.account_balance_wallet_outlined),
                  const SizedBox(width: 10),
                  _SnapshotPill(label: 'Sessions', value: '18', icon: Icons.history_outlined),
                ],
              ),

              const SizedBox(height: 20),

              Text('Recent Sessions',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textColor)),
              const SizedBox(height: 12),

              // Breakdown list
              ...breakdown.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.purple.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: Text('P',
                            style: TextStyle(
                                color: AppColors.purple,
                                fontSize: 15,
                                fontWeight: FontWeight.w800)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.$1,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textColor)),
                          Text('${b.$2}  •  ${b.$3}',
                              style: TextStyle(fontSize: 11, color: subColor)),
                        ],
                      ),
                    ),
                    Text(b.$4,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFB2A8D2))),
                  ],
                ),
              )),
            ],
          ),
        );
      },
    );
  }

  // Nearby parking data — images come from assets/images/.
  final List<ParkingLocation> _nearby = const [
    ParkingLocation(
      name: 'Arkan Mall',
      address: 'Sheikh Zayed, Giza',
      imageAsset: 'assets/images/arkan.jpg',
      availableSpots: 28,
      totalSpots: 80,
      ratePerHour: 15,
      opensAt: '7AM',
      closesAt: '12AM',
      isOpenNow: true,
      distanceKm: 0.5,
      levels: [
        ParkingLevel(name: 'Level 1 (Ground)', available: 0, total: 40),
        ParkingLevel(name: 'Level 2', available: 12, total: 40),
      ],
    ),
    ParkingLocation(
      name: 'New Giza University',
      address: 'Giza, New Giza',
      imageAsset: 'assets/images/ngu.jpg',
      availableSpots: 12,
      totalSpots: 60,
      ratePerHour: 0,
      opensAt: '7AM',
      closesAt: '10PM',
      isOpenNow: true,
      distanceKm: 0.5,
      levels: [
        ParkingLevel(name: 'Level 1', available: 12, total: 60),
      ],
    ),
    ParkingLocation(
      name: 'Cairo Airport T2',
      address: 'Cairo International Airport',
      imageAsset: 'assets/images/airport.jpg',
      availableSpots: 3,
      totalSpots: 200,
      ratePerHour: 25,
      opensAt: '24h',
      closesAt: '24h',
      isOpenNow: true,
      distanceKm: 1.2,
      levels: [
        ParkingLevel(name: 'Level 1', available: 3, total: 200),
      ],
    ),
    ParkingLocation(
      name: 'Tahrir Street',
      address: 'Tahrir Square, Downtown',
      imageAsset: 'assets/images/tahrir.jpg',
      availableSpots: 45,
      totalSpots: 100,
      ratePerHour: 10,
      opensAt: '6AM',
      closesAt: '11PM',
      isOpenNow: true,
      distanceKm: 2.1,
      levels: [
        ParkingLevel(name: 'Street Level', available: 45, total: 100),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // Greeting row: avatar + name/location + action icons.
              Row(
                children: [
                  // User avatar — replace with a real profile image.
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: AppColors.purple.withOpacity(0.2),
                    child: const Icon(Icons.person, color: AppColors.purple, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hello, Nour',
                            style: TextStyle(
                                color: textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w700)),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined,
                                color: AppColors.purple, size: 14),
                            const SizedBox(width: 2),
                            Text('Cairo, Egypt',
                                style: TextStyle(color: textSecondary, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Favourite and notification action buttons.
                  GestureDetector(
                    onTap: () => _showSavedSheet(context, isDark),
                    child: _IconBtn(icon: Icons.favorite_border, isDark: isDark),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _showNotificationsSheet(context, isDark),
                    child: _IconBtn(icon: Icons.notifications_outlined, isDark: isDark),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Search bar — navigates to SelectLocationScreen on tap.
              GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SelectLocationScreen()),
                ),
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: border),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(width: 14),
                      Icon(Icons.search, color: textSecondary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text('Search destination....',
                            style: TextStyle(color: textSecondary, fontSize: 14)),
                      ),
                      Icon(Icons.tune, color: textSecondary, size: 20),
                      const SizedBox(width: 14),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Active Parking Session section.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Active Parking Session',
                      style: TextStyle(
                          color: textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                  GestureDetector(
                    onTap: () => _showActiveSessionSheet(context, isDark),
                    child: Text('View Details',
                        style: TextStyle(
                            color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Active session card — transparent background, subtle purple glow.
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.purple.withOpacity(0.5), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.08),
                      blurRadius: 14,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Location name.
                    Text('Mall of Egypt',
                        style: TextStyle(
                            color: textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text('El Wahat Rd, First 6th of October, Giza Governorate',
                        style: TextStyle(color: textSecondary, fontSize: 11)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        // Elapsed time with clock icon.
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.purple.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.access_time,
                              color: AppColors.purple, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Live ticking timer.
                            Text(
                              _formatElapsed(_elapsed),
                              style: TextStyle(
                                  color: textPrimary,
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  fontFeatures: const [FontFeature.tabularFigures()]),
                            ),
                            Text('Elapsed Time  •  Started at 09:30pm',
                                style: TextStyle(color: textSecondary, fontSize: 11)),
                          ],
                        ),
                        const Spacer(),
                        // Slot and cost — top-aligned column, no background or border.
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            _InfoChip(
                              icon: Icons.local_parking,
                              label: 'Slot A2',
                              sub: 'Level C  •  Gate A',
                              isDark: isDark,
                            ),
                            const SizedBox(height: 8),
                            _InfoChip(
                              icon: Icons.attach_money,
                              label: '50.00 EGP',
                              sub: '',
                              isDark: isDark,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Nearby Parking section.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Nearby Parking',
                      style: TextStyle(
                          color: textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                  // View all → SelectLocationScreen.
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SelectLocationScreen()),
                    ),
                    child: Text('View all',
                        style: TextStyle(
                            color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Horizontal scrollable nearby parking cards.
              // Card height is set here (line ~331). Card width is in _NearbyCard width: 240 (~line 508).
              SizedBox(
                height: 160,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _nearby.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) {
                    final loc = _nearby[i];
                    return _NearbyCard(
                      location: loc,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ParkingDetailsScreen(location: loc),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 28),

              // Monthly Snapshot section.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Monthly Snapshot',
                      style: TextStyle(
                          color: textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                  GestureDetector(
                    onTap: () => _showMonthlySnapshotSheet(context, isDark),
                    child: Text('View Details',
                        style: TextStyle(
                            color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Three-stat snapshot card with gradient border.
              CustomPaint(
                painter: _GradientBorderPainter(
                  gradient: isDark
                      ? const LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [Color(0x887D39EB), Color(0xCC0A0320)],
                  )
                      : const LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [Color(0xFFE9E2FA), Color(0xFF7D39EB)],
                  ),
                  borderWidth: 1.5,
                  radius: 16,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                  decoration: BoxDecoration(
                    color: (isDark ? AppColors.surfaceDark : AppColors.surfaceLight).withOpacity(0.35),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _SnapshotStat(
                        icon: Icons.access_time_outlined,
                        value: '42h',
                        label: 'HOURS',
                        isDark: isDark,
                      ),
                      Container(width: 1, height: 40, color: border),
                      _SnapshotStat(
                        icon: Icons.photo_camera_outlined,
                        value: '300 EGP',
                        label: 'SPENT',
                        isDark: isDark,
                      ),
                      Container(width: 1, height: 40, color: border),
                      _SnapshotStat(
                        icon: Icons.history_outlined,
                        value: '18',
                        label: 'SESSIONS',
                        isDark: isDark,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// Small icon button used in the greeting row.
class _IconBtn extends StatelessWidget {
  final IconData icon;
  final bool isDark;
  const _IconBtn({required this.icon, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        shape: BoxShape.circle,
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: Icon(icon,
          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          size: 20),
    );
  }
}

// Label/value row with an icon used inside the active session detail sheet.
class _SheetDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color textColor;
  final Color subColor;
  const _SheetDetailRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.textColor,
    required this.subColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFFB2A8D2)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label, style: TextStyle(fontSize: 13, color: subColor)),
        ),
        Text(value,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: textColor)),
      ],
    );
  }
}

// Info row used in the active session card — no background or border,
// icon in #B2A8D2, label in white, subtitle in secondary grey.
class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final bool isDark;
  const _InfoChip(
      {required this.icon,
        required this.label,
        required this.sub,
        required this.isDark});

  static const _iconColor = Color(0xFFB2A8D2);

  @override
  Widget build(BuildContext context) {
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Icon uses the muted lavender #B2A8D2 colour.
        Icon(icon, color: _iconColor, size: 16),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(
                    color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            if (sub.isNotEmpty)
              Text(sub,
                  style: TextStyle(color: textSecondary, fontSize: 11)),
          ],
        ),
      ],
    );
  }
}

// Nearby parking card — image background with name, rating and availability overlay.
class _NearbyCard extends StatelessWidget {
  final ParkingLocation location;
  final VoidCallback onTap;
  const _NearbyCard({required this.location, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isAvailable = location.availableSpots > 0;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 240,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image.
              Image.asset(
                location.imageAsset,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: AppColors.purple.withOpacity(0.2),
                  child: const Icon(Icons.local_parking,
                      color: AppColors.purple, size: 40),
                ),
              ),

              // Dark gradient so text is readable over any photo.
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.75),
                    ],
                  ),
                ),
              ),

              // Distance badge top-right.
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('${location.distanceKm} km',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600)),
                ),
              ),

              // Bottom overlay: name, address, availability dot + rate.
              Positioned(
                left: 10,
                right: 10,
                bottom: 10,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(location.name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                    Text(location.address,
                        style: const TextStyle(color: Colors.white70, fontSize: 10),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Availability status dot + label.
                        Row(
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: isAvailable
                                    ? const Color(0xFF22C55E)
                                    : Colors.orangeAccent,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isAvailable ? 'Available' : 'Limited Spots',
                              style: TextStyle(
                                color: isAvailable
                                    ? const Color(0xFF22C55E)
                                    : Colors.orangeAccent,
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        // Rate label.
                        Text(
                          location.ratePerHour == 0
                              ? 'Free'
                              : 'EGP ${location.ratePerHour} /hr',
                          style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Single stat column used in the Monthly Snapshot card.
class _SnapshotStat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final bool isDark;
  const _SnapshotStat(
      {required this.icon,
        required this.value,
        required this.label,
        required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Column(
      children: [
        Icon(icon, color: AppColors.purple, size: 22),
        const SizedBox(height: 8),
        Text(value,
            style: TextStyle(
                color: textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(color: textSecondary, fontSize: 10, letterSpacing: 0.8)),
      ],
    );
  }
}
// Compact pill used in the monthly snapshot sheet to show a key stat.
class _SnapshotPill extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _SnapshotPill({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.purple.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.purple.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.purple, size: 18),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 1),
            Text(label,
                style: const TextStyle(fontSize: 10, color: Color(0xFFB2A8D2))),
          ],
        ),
      ),
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