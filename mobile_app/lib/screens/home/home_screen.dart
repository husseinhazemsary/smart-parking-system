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
                  _IconBtn(icon: Icons.favorite_border, isDark: isDark),
                  const SizedBox(width: 8),
                  _IconBtn(icon: Icons.notifications_outlined, isDark: isDark),
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
                    onTap: () {},
                    child: const Text('View Details',
                        style: TextStyle(
                            color: AppColors.accentGreen,
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Active session card — transparent background, layered purple glow to signal importance.
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  // Very light purple tint so content beneath subtly shows.
                  color: AppColors.purple.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.purple.withOpacity(0.8), width: 1.5),
                  boxShadow: [
                    // Wide soft outer glow — gives the floating, important feel.
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.18),
                      blurRadius: 24,
                      spreadRadius: 2,
                    ),
                    // Tight inner glow — sharpens the border edge so it looks lit.
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.28),
                      blurRadius: 6,
                      spreadRadius: 0,
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
                    child: const Text('View all',
                        style: TextStyle(
                            color: AppColors.accentGreen,
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
                    onTap: () {},
                    child: const Text('View Details',
                        style: TextStyle(
                            color: AppColors.accentGreen,
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Three-stat snapshot card.
              Container(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                decoration: BoxDecoration(
                  color: surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: border),
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