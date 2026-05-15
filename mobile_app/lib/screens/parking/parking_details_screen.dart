import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/parking_lot_model.dart';
import '../../providers/parking_provider.dart';
import '../../theme/app_colors.dart';
import 'alerts_setup_sheet.dart';
import 'view_slots_screen.dart';
import 'reservation_sheet.dart';

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
  bool _isFavourited = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchDetail(widget.lotId);
    });
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
        child: Consumer<ParkingProvider>(
          builder: (context, provider, _) {
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

                        // Name, address, spots and quick actions.
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(detail.name,
                                  style: TextStyle(
                                      color: textPrimary,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text(detail.address,
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
                                      isDark: isDark),
                                  const SizedBox(width: 12),
                                  _QuickAction(
                                      icon: Icons.warning_amber_outlined,
                                      label: 'Report',
                                      isDark: isDark),
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
                                        locationName: detail.name,
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
                                  onPressed: () =>
                                      showAlertsSetupSheet(context, detail.name),
                                  icon: Icon(Icons.notifications_outlined,
                                      size: 18, color: textPrimary),
                                  label: Text('Set Alerts',
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

                        // Map preview placeholder.
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
                                  Container(color: const Color(0xFF0D1B2A)),
                                  CustomPaint(painter: _MapGridPainter()),
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
                                  Positioned(
                                    bottom: 10,
                                    right: 10,
                                    child: GestureDetector(
                                      onTap: () {},
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
                                        Center(
                                          child: GestureDetector(
                                            onTap: () {},
                                            child: const Text(
                                                'View Parking Subscriptions',
                                                style: TextStyle(
                                                    color: AppColors.accentGreen,
                                                    fontSize: 11,
                                                    fontWeight:
                                                        FontWeight.w500)),
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
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Container(
                                                padding:
                                                    const EdgeInsets.all(6),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF59E0B)
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
                                        ),
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
                                                Text(detail.displayOpeningTime,
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
                                                Text(detail.displayClosingTime,
                                                    style: TextStyle(
                                                        color: textPrimary,
                                                        fontSize: 16,
                                                        fontWeight:
                                                            FontWeight.w700)),
                                              ],
                                            ),
                                          ],
                                        ),
                                        Text(
                                          detail.isOpenNow ? 'Open Now' : 'Closed',
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

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1A2E40)
      ..strokeWidth = 1;
    for (double y = 0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    for (double x = 0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    final roadPaint = Paint()
      ..color = const Color(0xFF243B55)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(0, size.height * 0.4),
        Offset(size.width, size.height * 0.4), roadPaint);
    canvas.drawLine(Offset(size.width * 0.35, 0),
        Offset(size.width * 0.35, size.height), roadPaint);
  }

  @override
  bool shouldRepaint(_MapGridPainter oldDelegate) => false;
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  const _QuickAction(
      {required this.icon, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Column(
      children: [
        Icon(icon, color: textSecondary, size: 22),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: textSecondary, fontSize: 11)),
      ],
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
