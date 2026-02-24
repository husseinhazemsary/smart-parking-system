// Select Location screen — full list of parking locations with search,
// category filters and a View Details button per card.
// Navigated to from HomeScreen when "View all" is tapped.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'parking_details_screen.dart';

// Sample data — reuse the same ParkingLocation model from parking_details_screen.
final List<ParkingLocation> allParkingLocations = [
  ParkingLocation(
    name: 'Arkan Mall Parking',
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
    name: 'NGU Parking Lot',
    address: 'New Giza, Cairo-Alexandria Desert Road, Giza',
    imageAsset: 'assets/images/ngu.jpg',
    availableSpots: 12,
    totalSpots: 60,
    ratePerHour: 0,
    opensAt: '7AM',
    closesAt: '10PM',
    isOpenNow: true,
    distanceKm: 0.5,
    levels: [
      ParkingLevel(name: 'Level 1 (Ground)', available: 12, total: 60),
    ],
  ),
  ParkingLocation(
    name: 'Cairo Airport Terminal 2',
    address: 'Cairo International Airport, Cairo',
    imageAsset: 'assets/images/airport.jpg',
    availableSpots: 3,
    totalSpots: 200,
    ratePerHour: 25,
    opensAt: '24h',
    closesAt: '24h',
    isOpenNow: true,
    distanceKm: 0.5,
    levels: [
      ParkingLevel(name: 'Level 1', available: 3, total: 200),
    ],
  ),
  ParkingLocation(
    name: 'Tahrir Street Parking',
    address: 'Tahrir Square, Downtown, Cairo',
    imageAsset: 'assets/images/tahrir.jpg',
    availableSpots: 45,
    totalSpots: 100,
    ratePerHour: 10,
    opensAt: '6AM',
    closesAt: '11PM',
    isOpenNow: true,
    distanceKm: 0.5,
    levels: [
      ParkingLevel(name: 'Street Level', available: 45, total: 100),
    ],
  ),
];

class SelectLocationScreen extends StatefulWidget {
  const SelectLocationScreen({super.key});

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  int _categoryIndex = 0;
  final List<String> _categories = ['All', 'Malls', 'Universities', 'Airports', 'Streets'];
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Returns a short availability label and its color based on spot count.
  (String, Color) _availability(ParkingLocation loc) {
    final ratio = loc.availableSpots / loc.totalSpots;
    if (ratio == 0) return ('Full', Colors.redAccent);
    if (ratio < 0.1) return ('Almost Full', Colors.redAccent);
    if (ratio < 0.4) return ('Filling Fast', const Color(0xFFF59E0B));
    return ('High Availability', const Color(0xFF22C55E));
  }

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
        child: Column(
          children: [
            // Header: back button + left-aligned title + filter icon.
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
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text('Select Location',
                        style: TextStyle(
                            color: textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.w700)),
                  ),
                  Icon(Icons.tune, color: textPrimary, size: 22),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Search bar.
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: border),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Icon(Icons.search, color: textSecondary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: TextStyle(color: textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search address, place....',
                          hintStyle: TextStyle(color: textSecondary, fontSize: 14),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Category filter chips.
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final active = _categoryIndex == i;
                  return GestureDetector(
                    onTap: () => setState(() => _categoryIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: active ? AppColors.purple : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: active ? AppColors.purple : border),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _categories[i],
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

            const SizedBox(height: 14),

            // Location cards list.
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: allParkingLocations.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final loc = allParkingLocations[i];
                  final (availLabel, availColor) = _availability(loc);
                  final spotsLeft = loc.availableSpots;

                  return Container(
                    decoration: BoxDecoration(
                      color: surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: border, width: 2),
                    ),
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Thumbnail with distance badge.
                              Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: Image.asset(
                                      loc.imageAsset,
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
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.65),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text('${loc.distanceKm} km',
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600)),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(width: 12),

                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(loc.name,
                                              style: TextStyle(
                                                  color: textPrimary,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16)),
                                        ),
                                        Text(
                                          loc.ratePerHour == 0
                                              ? 'EGP 0 /hr'
                                              : 'EGP ${loc.ratePerHour} /hr',
                                          style: const TextStyle(
                                              color: AppColors.accentGreen,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(loc.address,
                                        style: TextStyle(color: textSecondary, fontSize: 11),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                    const SizedBox(height: 8),
                                    // Availability label.
                                    Text(availLabel,
                                        style: TextStyle(
                                            color: availColor,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 4),
                                    // Availability progress bar.
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(4),
                                            child: LinearProgressIndicator(
                                              value: 1 - (loc.availableSpots / loc.totalSpots),
                                              backgroundColor: const Color(0xFF1E1E3A),
                                              valueColor: AlwaysStoppedAnimation<Color>(availColor),
                                              minHeight: 5,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text('$spotsLeft spots',
                                            style: TextStyle(
                                                color: textSecondary, fontSize: 11)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // View Details button — semi-transparent purple, smaller height.
                        GestureDetector(
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ParkingDetailsScreen(location: loc),
                            ),
                          ),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: AppColors.purple.withOpacity(0.2),
                              borderRadius: const BorderRadius.vertical(
                                  bottom: Radius.circular(16)),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('View Details',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600)),
                                SizedBox(width: 6),
                                Icon(Icons.arrow_forward, color: Colors.white, size: 14),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
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