import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/parking_lot_model.dart';
import '../../services/parking_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/parking_provider.dart';
import '../../providers/saved_place_provider.dart';
import '../../theme/app_colors.dart';
import 'alerts_setup_sheet.dart';
import 'view_slots_screen.dart';
import 'reservation_sheet.dart';
import 'subscription_plans_screen.dart';

class ParkingDetailsScreen extends StatefulWidget {
  final String lotId;
  final double? distanceKm;
  const ParkingDetailsScreen({
    super.key,
    required this.lotId,
    this.distanceKm,
  });

  @override
  State<ParkingDetailsScreen> createState() => _ParkingDetailsScreenState();
}

class _ParkingDetailsScreenState extends State<ParkingDetailsScreen> {
  AlertConfig? _alertConfig;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchDetail(widget.lotId);
    });
  }

  Future<void> _openInMaps(double lat, double lng, String name) async {
    final encodedName = Uri.encodeComponent(name);
    final geoUri = Uri.parse('geo:$lat,$lng?q=$lat,$lng($encodedName)');
    final webUri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$encodedName&center=$lat,$lng');
    if (await canLaunchUrl(geoUri)) {
      await launchUrl(geoUri);
    } else {
      await launchUrl(webUri, mode: LaunchMode.externalApplication);
    }
  }

  void _showWeeklySchedule(BuildContext context, ParkingLotDetail detail) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _WeeklyScheduleSheet(detail: detail),
    );
  }

  Future<void> _callNumber(String? phone) async {
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No phone number available for this parking lot')),
      );
      return;
    }
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _share(String lotName) {
    final url = 'https://ezrakna.app/lots/${widget.lotId}';
    Share.share('$lotName\n$url', subject: lotName);
  }

  void _showReportSheet(BuildContext context, ParkingLotDetail detail) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    const reasons = [
      'Incorrect information',
      'Parking lot is closed',
      'Safety concern',
      'Wrong location on map',
      'Other',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ReportSheet(
        lotId: widget.lotId,
        lotName: detail.localizedName(context.read<LocaleProvider>().isArabic),
        reasons: reasons,
        isDark: isDark,
        surface: surface,
        textPrimary: textPrimary,
        textSecondary: textSecondary,
        border: border,
        onSubmit: () {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Report submitted — thank you for your feedback'),
              backgroundColor: AppColors.purple,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isArabic = context.read<LocaleProvider>().isArabic;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Consumer2<ParkingProvider, SavedPlaceProvider>(
          builder: (context, provider, savedProvider, _) {
            final isLoading = provider.isLoadingDetail(widget.lotId);
            final error = provider.detailError(widget.lotId);
            final detail = provider.detailFor(widget.lotId);

            if (isLoading && detail == null) {
              return const Center(child: CircularProgressIndicator());
            }

            if (error != null && detail == null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, color: textSecondary, size: 48),
                      const SizedBox(height: 12),
                      Text(error,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: textSecondary, fontSize: 14)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => provider.fetchDetail(widget.lotId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.purple,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (detail == null) return const SizedBox();

            const dayKeys = [
              'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
            ];
            final todayIsOperating = detail.operatingDays.isEmpty ||
                detail.operatingDays.contains(dayKeys[DateTime.now().weekday - 1]);

            final savedMatches = savedProvider.places
                .where((p) => p.parkingLotId == widget.lotId);
            final savedPlace =
                savedMatches.isEmpty ? null : savedMatches.first;
            final isFavourited = savedPlace != null;

            return Column(
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
                              GestureDetector(
                                onTap: () async {
                                  if (!context.read<AuthProvider>().isAuthenticated) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Please log in to save parking lots'),
                                        backgroundColor: Colors.redAccent,
                                      ),
                                    );
                                    return;
                                  }
                                  final sp = context.read<SavedPlaceProvider>();
                                  final success = isFavourited
                                      ? await sp.removePlace(savedPlace!.id)
                                      : await sp.savePlace(widget.lotId);
                                  if (!success && context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(sp.error ?? 'Something went wrong'),
                                        backgroundColor: Colors.redAccent,
                                      ),
                                    );
                                  }
                                },
                                child: Icon(
                                  isFavourited
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  color: isFavourited
                                      ? Colors.redAccent
                                      : textPrimary,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              GestureDetector(
                                onTap: () => _share(detail.localizedName(isArabic)),
                                child: Icon(Icons.ios_share_outlined, color: textPrimary, size: 22),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Name, address, spots and quick actions.
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(detail.localizedName(isArabic),
                                  style: TextStyle(
                                      color: textPrimary,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text(detail.localizedAddress(isArabic),
                                  style: TextStyle(color: textSecondary, fontSize: 13)),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF22C55E).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: const Color(0xFF22C55E).withOpacity(0.4)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.circle,
                                            color: Color(0xFF22C55E), size: 8),
                                        const SizedBox(width: 6),
                                        Text('${detail.available} AVAILABLE',
                                            style: const TextStyle(
                                                color: Color(0xFF22C55E),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text('/ ${detail.total} Total Spots',
                                      style: TextStyle(color: textSecondary, fontSize: 13)),
                                  const Spacer(),
                                  _QuickAction(
                                      icon: Icons.phone_outlined,
                                      label: 'Call',
                                      isDark: isDark,
                                      onTap: () => _callNumber(detail.phoneNumber)),
                                  const SizedBox(width: 12),
                                  _QuickAction(
                                      icon: Icons.warning_amber_outlined,
                                      label: 'Report',
                                      isDark: isDark,
                                      onTap: () => _showReportSheet(context, detail)),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // View Slots and Set Alerts buttons.
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => ViewSlotsScreen(
                                        locationName: detail.localizedName(isArabic),
                                        lotId: widget.lotId,
                                      ),
                                    ),
                                  ),
                                  icon: const Icon(Icons.map_outlined, size: 18),
                                  label: const Text('View Slots'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.purple,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 14),
                                    textStyle: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => showAlertsSetupSheet(
                                    context,
                                    widget.lotId,
                                    detail.localizedName(isArabic),
                                    initialConfig: _alertConfig,
                                    onConfigured: (config) {
                                      if (!mounted) return;
                                      setState(() => _alertConfig = config);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Alerts enabled successfully'),
                                          backgroundColor: AppColors.purple,
                                        ),
                                      );
                                    },
                                  ),
                                  icon: Icon(Icons.notifications_outlined,
                                      size: 18, color: textPrimary),
                                  label: Text(
                                      _alertConfig != null ? 'Update Alerts' : 'Set Alerts',
                                      style: TextStyle(color: textPrimary)),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(color: border),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 14),
                                    textStyle: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Map preview.
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
                                  FlutterMap(
                                    options: MapOptions(
                                      initialCenter: LatLng(
                                          detail.latitude, detail.longitude),
                                      initialZoom: 16,
                                      interactionOptions:
                                          const InteractionOptions(
                                        flags: InteractiveFlag.none,
                                      ),
                                    ),
                                    children: [
                                      TileLayer(
                                        urlTemplate: isDark
                                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                                        subdomains: const ['a', 'b', 'c', 'd'],
                                        userAgentPackageName: 'com.ezrakna.app',
                                        retinaMode: RetinaMode.isHighDensity(context),
                                      ),
                                      MarkerLayer(
                                        markers: [
                                          Marker(
                                            point: LatLng(detail.latitude,
                                                detail.longitude),
                                            child: const Icon(Icons.location_on,
                                                color: AppColors.purple,
                                                size: 36),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Positioned(
                                    bottom: 10,
                                    right: 10,
                                    child: GestureDetector(
                                      onTap: () => _openInMaps(
                                          detail.latitude, detail.longitude, detail.localizedName(isArabic)),
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

                        // Rate + Hours cards.
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Expanded(
                                  child: _GradientInfoCard(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(6),
                                              decoration: BoxDecoration(
                                                color: AppColors.purple
                                                    .withOpacity(0.15),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(
                                                  Icons.attach_money,
                                                  color: AppColors.purple,
                                                  size: 14),
                                            ),
                                            const SizedBox(width: 8),
                                            Text('Hourly Rate',
                                                style: TextStyle(
                                                    color: textSecondary,
                                                    fontSize: 15,
                                                    fontWeight:
                                                        FontWeight.w600)),
                                          ],
                                        ),
                                        Center(
                                          child: RichText(
                                            text: TextSpan(
                                              children: [
                                                TextSpan(
                                                    text: detail.hourlyRate == 0
                                                        ? 'Free'
                                                        : '${detail.hourlyRate.toStringAsFixed(detail.hourlyRate.truncateToDouble() == detail.hourlyRate ? 0 : 2)} EGP',
                                                    style: TextStyle(
                                                        color: textPrimary,
                                                        fontSize: 20,
                                                        fontWeight:
                                                            FontWeight.w700)),
                                                if (detail.hourlyRate > 0)
                                                  TextSpan(
                                                      text: ' / hr',
                                                      style: TextStyle(
                                                          color: textSecondary,
                                                          fontSize: 13)),
                                              ],
                                            ),
                                          ),
                                        ),
                                        if (detail.hasSubscriptions)
                                          Center(
                                            child: GestureDetector(
                                              onTap: () => Navigator.of(context).push(
                                                MaterialPageRoute(
                                                  builder: (_) => SubscriptionPlansScreen(
                                                    lotId: widget.lotId,
                                                    lotName: detail.localizedName(isArabic),
                                                  ),
                                                ),
                                              ),
                                              child: const Text(
                                                  'View Parking Subscriptions',
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
                                Expanded(
                                  child: _GradientInfoCard(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.all(6),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                            0xFFF59E0B)
                                                        .withOpacity(0.15),
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                      Icons.access_time,
                                                      color: Color(0xFFF59E0B),
                                                      size: 14),
                                                ),
                                                const SizedBox(width: 8),
                                                Text('Hours',
                                                    style: TextStyle(
                                                        color: textSecondary,
                                                        fontSize: 15,
                                                        fontWeight:
                                                            FontWeight.w600)),
                                              ],
                                            ),
                                            GestureDetector(
                                              onTap: () => _showWeeklySchedule(
                                                  context, detail),
                                              child: Text('View Schedule',
                                                  style: TextStyle(
                                                      color: AppColors.purple,
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w600)),
                                            ),
                                          ],
                                        ),
                                        if (todayIsOperating)
                                          Column(
                                            children: [
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  Text('Opens  ',
                                                      style: TextStyle(
                                                          color: textSecondary,
                                                          fontSize: 13)),
                                                  Text(
                                                      detail.displayOpeningTime,
                                                      style: TextStyle(
                                                          color: textPrimary,
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w700)),
                                                ],
                                              ),
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  Text('Closes  ',
                                                      style: TextStyle(
                                                          color: textSecondary,
                                                          fontSize: 13)),
                                                  Text(
                                                      detail.displayClosingTime,
                                                      style: TextStyle(
                                                          color: textPrimary,
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w700)),
                                                ],
                                              ),
                                            ],
                                          )
                                        else
                                          Text('Closed today',
                                              style: TextStyle(
                                                  color: Colors.redAccent,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500)),
                                        if (todayIsOperating)
                                          Text(
                                            detail.isOpenNow
                                                ? 'Open Now'
                                                : 'Closed',
                                            style: TextStyle(
                                              color: detail.isOpenNow
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

                        // Live availability card.
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: _GradientInfoCard(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Live Availability',
                                        style: TextStyle(
                                            color: textPrimary,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600)),
                                    Text('Live',
                                        style: TextStyle(
                                            color: textSecondary,
                                            fontSize: 11)),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                _AvailabilityRow(
                                  label: 'All Slots',
                                  available: detail.available,
                                  total: detail.total,
                                  textSecondary: textSecondary,
                                ),
                                if (detail.amenities.isNotEmpty) ...[
                                  const SizedBox(height: 14),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: Wrap(
                                      spacing: 6,
                                      runSpacing: 6,
                                      children: detail.amenities
                                          .map((a) => Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 10,
                                                        vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: AppColors.purple
                                                      .withOpacity(0.1),
                                                  borderRadius:
                                                      BorderRadius.circular(20),
                                                ),
                                                child: Text(a,
                                                    style: TextStyle(
                                                        color: AppColors.purple,
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w500)),
                                              ))
                                          .toList(),
                                    ),
                                  ),
                                ],
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
            );
          },
        ),
      ),

      bottomNavigationBar: Consumer<ParkingProvider>(
        builder: (context, provider, _) {
          final detail = provider.detailFor(widget.lotId);
          if (detail == null) return const SizedBox();
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final textSecondary =
              isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
          return Container(
            padding: EdgeInsets.fromLTRB(
                20, 12, 20, MediaQuery.of(context).viewPadding.bottom + 12),
            color:
                isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ElevatedButton(
                  onPressed: () => showReservationSheet(context, success: true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.purple,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    textStyle: const TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Reserve'),
                ),
                const SizedBox(height: 6),
                Text('Reservation lasts 10 mins only',
                    style: TextStyle(color: textSecondary, fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );
  }
}

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


class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  final VoidCallback? onTap;
  const _QuickAction(
      {required this.icon, required this.label, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: textSecondary, size: 22),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: textSecondary, fontSize: 11)),
        ],
      ),
    );
  }
}

class _WeeklyScheduleSheet extends StatelessWidget {
  final ParkingLotDetail detail;
  const _WeeklyScheduleSheet({required this.detail});

  static const _dayKeys = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];
  static const _dayLabels = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final todayKey = _dayKeys[DateTime.now().weekday - 1];

    final navBarPadding = MediaQuery.of(context).viewPadding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + navBarPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text('Weekly Schedule',
              style: TextStyle(
                  color: textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(detail.localizedName(
                  Provider.of<LocaleProvider>(context, listen: false).isArabic),
              style: TextStyle(color: textSecondary, fontSize: 12)),
          const SizedBox(height: 16),
          ...List.generate(7, (i) {
            final key = _dayKeys[i];
            final label = _dayLabels[i];
            final isOperating = detail.operatingDays.isEmpty ||
                detail.operatingDays.contains(key);
            final isToday = key == todayKey;
            return Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: isToday
                  ? BoxDecoration(
                      border: Border.all(
                          color: AppColors.accentGreen, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                      color: AppColors.accentGreen.withOpacity(0.07),
                    )
                  : null,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 92,
                    child: Text(label,
                        style: TextStyle(
                            color: isToday
                                ? AppColors.accentGreen
                                : textPrimary,
                            fontSize: 14,
                            fontWeight: isToday
                                ? FontWeight.w700
                                : FontWeight.w500)),
                  ),
                  if (isOperating) ...[
                    Text(detail.displayOpeningTime,
                        style: TextStyle(
                            color: isToday
                                ? AppColors.accentGreen
                                : textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                    Text(' – ',
                        style: TextStyle(
                            color: isToday
                                ? AppColors.accentGreen
                                : textSecondary,
                            fontSize: 14)),
                    Text(detail.displayClosingTime,
                        style: TextStyle(
                            color: isToday
                                ? AppColors.accentGreen
                                : textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                  ] else
                    Text('Closed',
                        style: TextStyle(
                            color: Colors.redAccent,
                            fontSize: 14,
                            fontWeight: FontWeight.w500)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _ReportSheet extends StatefulWidget {
  final String lotId;
  final String lotName;
  final List<String> reasons;
  final bool isDark;
  final Color surface;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final VoidCallback onSubmit;

  const _ReportSheet({
    required this.lotId,
    required this.lotName,
    required this.reasons,
    required this.isDark,
    required this.surface,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    required this.onSubmit,
  });

  @override
  State<_ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends State<_ReportSheet> {
  int? _selectedIndex;
  bool _isSubmitting = false;
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedIndex == null) return;
    setState(() => _isSubmitting = true);
    try {
      await ParkingService.submitReport(
        widget.lotId,
        widget.reasons[_selectedIndex!],
        _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
      );
      if (mounted) {
        Navigator.of(context).pop();
        widget.onSubmit();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit report: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: widget.isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
          20, 20, 20,
          MediaQuery.of(context).viewInsets.bottom +
              MediaQuery.of(context).viewPadding.bottom +
              24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                  color: widget.border,
                  borderRadius: BorderRadius.circular(2)),
            ),
          ),
            Text('Report an Issue',
                style: TextStyle(
                    color: widget.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(widget.lotName,
                style: TextStyle(color: widget.textSecondary, fontSize: 13)),
            const SizedBox(height: 16),
            ...List.generate(widget.reasons.length, (i) {
              final selected = _selectedIndex == i;
              return GestureDetector(
                onTap: () => setState(() => _selectedIndex = i),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: widget.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: selected ? AppColors.purple : widget.border,
                        width: selected ? 1.5 : 1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 18,
                        height: 18,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: selected ? AppColors.purple : widget.border,
                              width: 2),
                          color: selected ? AppColors.purple : Colors.transparent,
                        ),
                        child: selected
                            ? const Icon(Icons.check, color: Colors.white, size: 11)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Text(widget.reasons[i],
                          style: TextStyle(
                              color: selected ? AppColors.purple : widget.textPrimary,
                              fontSize: 14,
                              fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 4),
            TextField(
              controller: _noteController,
              maxLines: 3,
              style: TextStyle(color: widget.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Additional details (optional)',
                hintStyle: TextStyle(color: widget.textSecondary, fontSize: 14),
                filled: true,
                fillColor: widget.surface,
                contentPadding: const EdgeInsets.all(12),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: widget.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: (_selectedIndex == null || _isSubmitting) ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.purple.withOpacity(0.4),
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : const Text('Submit Report'),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvailabilityRow extends StatelessWidget {
  final String label;
  final int available;
  final int total;
  final Color textSecondary;
  const _AvailabilityRow({
    required this.label,
    required this.available,
    required this.total,
    required this.textSecondary,
  });

  double get _occupancy => total == 0 ? 0 : (total - available) / total;

  Color get _color {
    if (_occupancy >= 0.9) return Colors.redAccent;
    if (_occupancy >= 0.6) return const Color(0xFFF59E0B);
    return const Color(0xFF22C55E);
  }

  String get _label => available == 0 ? 'Full' : '$available spots';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: TextStyle(color: textSecondary, fontSize: 13)),
            Text(_label,
                style: TextStyle(
                    color: available == 0 ? Colors.redAccent : _color,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: _occupancy,
            backgroundColor: const Color(0xFF1E1E3A),
            valueColor: AlwaysStoppedAnimation<Color>(_color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
