// Parking details screen — shows full info for a selected parking location.
// Includes live availability per level, hourly rate, hours, map preview,
// and a Reserve button. Navigated to from HomeScreen or SelectLocationScreen.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'alerts_setup_sheet.dart';
import 'view_slots_screen.dart';
import 'reservation_sheet.dart';

// Data model passed in from the calling screen.
class ParkingLocation {
  final String name;
  final String address;
  final String imageAsset;
  final int availableSpots;
  final int totalSpots;
  final int ratePerHour;
  final String opensAt;
  final String closesAt;
  final bool isOpenNow;
  final double distanceKm;
  final List<ParkingLevel> levels;

  const ParkingLocation({
    required this.name,
    required this.address,
    required this.imageAsset,
    required this.availableSpots,
    required this.totalSpots,
    required this.ratePerHour,
    required this.opensAt,
    required this.closesAt,
    required this.isOpenNow,
    required this.distanceKm,
    required this.levels,
  });
}

// Availability data for a single parking level.
class ParkingLevel {
  final String name;
  final int available;
  final int total;
  const ParkingLevel({required this.name, required this.available, required this.total});

  // 0.0 = empty, 1.0 = full.
  double get occupancy => (total - available) / total;

  String get label => available == 0 ? 'Full' : '$available spots';

  // Color shifts from green → orange → red as occupancy rises.
  Color get color {
    if (occupancy >= 0.9) return Colors.redAccent;
    if (occupancy >= 0.6) return const Color(0xFFF59E0B);
    return const Color(0xFF22C55E);
  }
}

class ParkingDetailsScreen extends StatefulWidget {
  final ParkingLocation location;
  const ParkingDetailsScreen({super.key, required this.location});

  @override
  State<ParkingDetailsScreen> createState() => _ParkingDetailsScreenState();
}

class _ParkingDetailsScreenState extends State<ParkingDetailsScreen> {
  // Tracks whether the user has favourited this parking location.
  bool _isFavourited = false;

  @override
  Widget build(BuildContext context) {
    final location = widget.location;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top bar: back, favourite, share.
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Navigator.of(context).pop(),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: surface,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: border),
                              ),
                              child: Icon(Icons.arrow_back, size: 20, color: textPrimary),
                            ),
                          ),
                          const Spacer(),
// Tapping toggles between favourite_border and favourite (filled).
                          GestureDetector(
                            onTap: () => setState(() => _isFavourited = !_isFavourited),
                            child: Icon(
                              _isFavourited ? Icons.favorite : Icons.favorite_border,
                              color: _isFavourited ? Colors.redAccent : textPrimary,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          GestureDetector(
                            onTap: () {},
                            child: Icon(Icons.ios_share_outlined, color: textPrimary, size: 22),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Parking name, address, spot count and action icons.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(location.name,
                              style: TextStyle(
                                  color: textPrimary,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(location.address,
                              style: TextStyle(color: textSecondary, fontSize: 13)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              // Available spots badge.
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF22C55E).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.4)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.circle, color: Color(0xFF22C55E), size: 8),
                                    const SizedBox(width: 6),
                                    Text('${location.availableSpots} AVAILABLE',
                                        style: const TextStyle(
                                            color: Color(0xFF22C55E),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text('/ ${location.totalSpots} Total Spots',
                                  style: TextStyle(color: textSecondary, fontSize: 13)),
                              const Spacer(),
                              // Call and Report quick actions.
                              _QuickAction(icon: Icons.phone_outlined, label: 'Call', isDark: isDark),
                              const SizedBox(width: 12),
                              _QuickAction(icon: Icons.warning_amber_outlined, label: 'Report', isDark: isDark),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // View Slots and Set Alerts action buttons.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => ViewSlotsScreen(
                                  locationName: location.name,
                                  zone: 'Zone A • Level B1',
                                )),
                              ),
                              icon: const Icon(Icons.map_outlined, size: 18),
                              label: const Text('View Slots'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.purple,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                textStyle: const TextStyle(
                                    fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => showAlertsSetupSheet(context, location.name),
                              icon: Icon(Icons.notifications_outlined,
                                  size: 18, color: textPrimary),
                              label: Text('Set Alerts',
                                  style: TextStyle(color: textPrimary)),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: border),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                textStyle: const TextStyle(
                                    fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Map preview — uses a styled placeholder until flutter_map or
                    // google_maps_flutter is integrated. Shows a grid pattern to imply
                    // a map surface, with the location pin and "Open in Maps" button.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: SizedBox(
                          width: double.infinity,
                          height: 160,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Dark map-like background.
                              Container(color: const Color(0xFF0D1B2A)),
                              // Grid lines to simulate a map tile.
                              CustomPaint(painter: _MapGridPainter()),
                              // Centred location pin.
                              const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.location_on,
                                        color: AppColors.purple, size: 36),
                                    SizedBox(height: 4),
                                    Text('Map preview',
                                        style: TextStyle(
                                            color: Colors.white54, fontSize: 11)),
                                  ],
                                ),
                              ),
                              // Open in Maps overlay button.
                              Positioned(
                                bottom: 10,
                                right: 10,
                                child: GestureDetector(
                                  onTap: () {
                                    // TODO: launch maps URL with location.coordinates
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.7),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.open_in_new,
                                            color: Colors.white, size: 12),
                                        SizedBox(width: 4),
                                        Text('Open in Maps',
                                            style: TextStyle(
                                                color: Colors.white, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // INFORMATION section label.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text('INFORMATION',
                          style: TextStyle(
                              color: textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2)),
                    ),

                    const SizedBox(height: 12),

                    // IntrinsicHeight forces both info cards to match the taller one's height.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Hourly Rate card — title at top (matching Hours title height),
                            // rate value in centre, subscription link pinned to the bottom.
                            Expanded(
                              child: _GradientInfoCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Title row at the very top — same vertical position as Hours title.
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(6),
                                          decoration: BoxDecoration(
                                            color: AppColors.purple.withOpacity(0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.attach_money,
                                              color: AppColors.purple, size: 14),
                                        ),
                                        const SizedBox(width: 8),
                                        Text('Hourly Rate',
                                            style: TextStyle(
                                                color: textSecondary,
                                                fontSize: 15,
                                                fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                    // Rate value centred in remaining space.
                                    Center(
                                      child: RichText(
                                        text: TextSpan(
                                          children: [
                                            TextSpan(
                                                text: '${location.ratePerHour} EGP',
                                                style: TextStyle(
                                                    color: textPrimary,
                                                    fontSize: 20,
                                                    fontWeight: FontWeight.w700)),
                                            TextSpan(
                                                text: ' / hr',
                                                style: TextStyle(
                                                    color: textSecondary, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                    ),
                                    // Subscription link pinned to bottom and centred.
                                    Center(
                                      child: GestureDetector(
                                        onTap: () {},
                                        child: const Text('View Parking Subscriptions',
                                            style: TextStyle(
                                                color: AppColors.accentGreen,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Hours card — spaceBetween mirrors hourly rate layout so titles align.
                            Expanded(
                              child: _GradientInfoCard(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    // Title at the top — same vertical position as Hourly Rate title.
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF59E0B).withOpacity(0.15),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(Icons.access_time,
                                                color: Color(0xFFF59E0B), size: 14),
                                          ),
                                          const SizedBox(width: 8),
                                          Text('Hours',
                                              style: TextStyle(
                                                  color: textSecondary,
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w600)),
                                        ],
                                      ),
                                    ),
                                    // Opens and Closes stacked with no gap, centred.
                                    Column(
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text('Opens  ',
                                                style: TextStyle(color: textSecondary, fontSize: 13)),
                                            Text(location.opensAt,
                                                style: TextStyle(
                                                    color: textPrimary,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w700)),
                                          ],
                                        ),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text('Closes  ',
                                                style: TextStyle(color: textSecondary, fontSize: 13)),
                                            Text(location.closesAt,
                                                style: TextStyle(
                                                    color: textPrimary,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w700)),
                                          ],
                                        ),
                                      ],
                                    ),
                                    // Open Now / Closed at bottom — mirrors subscription link.
                                    Text(
                                      location.isOpenNow ? 'Open Now' : 'Closed',
                                      style: TextStyle(
                                        color: location.isOpenNow
                                            ? const Color(0xFF22C55E)
                                            : Colors.redAccent,
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
                    ),

                    const SizedBox(height: 16),

                    // Live availability per level — gradient border card.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _GradientInfoCard(
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Live Availability',
                                    style: TextStyle(
                                        color: textPrimary,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600)),
                                Text('Updated 2m ago',
                                    style: TextStyle(color: textSecondary, fontSize: 11)),
                              ],
                            ),
                            const SizedBox(height: 14),
                            ...location.levels.map((level) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _LevelRow(level: level, textSecondary: textSecondary),
                            )),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Reserve button pinned at the bottom.
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
            20, 12, 20, MediaQuery.of(context).viewPadding.bottom + 12),
        color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              onPressed: () => showReservationSheet(context, success: true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              child: const Text('Reserve'),
            ),
            const SizedBox(height: 6),
            Text('Reservation lasts 10 mins only',
                style: TextStyle(color: textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

// Plain info card — surface background with a subtle border, no gradient.
class _GradientInfoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  const _GradientInfoCard({
    required this.child,
    this.padding = const EdgeInsets.all(12),
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: child,
    );
  }
}

// Paints a subtle grid over a dark background to simulate a map tile.
// Replace this with flutter_map (OpenStreetMap) or google_maps_flutter.
class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1A2E40)
      ..strokeWidth = 1;

    // Horizontal grid lines.
    for (double y = 0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    // Vertical grid lines.
    for (double x = 0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // A few thicker "road" lines to make it feel more map-like.
    final roadPaint = Paint()
      ..color = const Color(0xFF243B55)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
        Offset(0, size.height * 0.4), Offset(size.width, size.height * 0.4), roadPaint);
    canvas.drawLine(
        Offset(size.width * 0.35, 0), Offset(size.width * 0.35, size.height), roadPaint);
  }

  @override
  bool shouldRepaint(_MapGridPainter oldDelegate) => false;
}

// Small icon + label column used for Call and Report quick actions.
class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  const _QuickAction({required this.icon, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Column(
      children: [
        Icon(icon, color: textSecondary, size: 22),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: textSecondary, fontSize: 11)),
      ],
    );
  }
}

// Single parking level row: name, progress bar, spot count label.
class _LevelRow extends StatelessWidget {
  final ParkingLevel level;
  final Color textSecondary;
  const _LevelRow({required this.level, required this.textSecondary});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(level.name, style: TextStyle(color: textSecondary, fontSize: 13)),
            Text(
              level.label,
              style: TextStyle(
                color: level.available == 0 ? Colors.redAccent : level.color,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: level.occupancy,
            backgroundColor: const Color(0xFF1E1E3A),
            valueColor: AlwaysStoppedAnimation<Color>(level.color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}