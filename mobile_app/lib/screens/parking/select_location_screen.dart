import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/parking_lot_model.dart';
import '../../providers/parking_provider.dart';
import '../../theme/app_colors.dart';
import 'parking_details_screen.dart';

class SelectLocationScreen extends StatefulWidget {
  const SelectLocationScreen({super.key});

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  int _categoryIndex = 0;
  final List<String> _categories = [
    'All',
    'Malls',
    'Universities',
    'Airports',
    'Streets'
  ];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchLots();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _lotPlaceholder() => Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: AppColors.purple.withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.local_parking, color: AppColors.purple, size: 32),
      );

  (String, Color) _availability(ParkingLotSummary lot) {
    if (lot.total == 0) return ('No Data', Colors.grey);
    final ratio = lot.available / lot.total;
    if (ratio == 0) return ('Full', Colors.redAccent);
    if (ratio < 0.1) return ('Almost Full', Colors.redAccent);
    if (ratio < 0.4) return ('Filling Fast', const Color(0xFFF59E0B));
    return ('High Availability', const Color(0xFF22C55E));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            // Header.
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
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          hintText: 'Search address, place....',
                          hintStyle:
                              TextStyle(color: textSecondary, fontSize: 14),
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

            // Category chips.
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
                        border: Border.all(
                            color: active ? AppColors.purple : border),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _categories[i],
                        style: TextStyle(
                          color: active ? Colors.white : textSecondary,
                          fontSize: 13,
                          fontWeight: active
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 14),

            // Location list.
            Expanded(
              child: Consumer<ParkingProvider>(
                builder: (context, provider, _) {
                  if (provider.isLoadingLots && provider.lots.isEmpty) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (provider.lotsError != null && provider.lots.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.error_outline,
                                color: textSecondary, size: 48),
                            const SizedBox(height: 12),
                            Text(provider.lotsError!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: textSecondary, fontSize: 14)),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () => provider.fetchLots(),
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

                  final query = _searchController.text.toLowerCase();
                  final filtered = provider.lots.where((lot) {
                    if (query.isNotEmpty &&
                        !lot.name.toLowerCase().contains(query) &&
                        !lot.address.toLowerCase().contains(query)) {
                      return false;
                    }
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Text('No parking lots found',
                          style: TextStyle(color: textSecondary, fontSize: 14)),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 20),
                    itemBuilder: (_, i) {
                      final lot = filtered[i];
                      final (availLabel, availColor) = _availability(lot);

                      return CustomPaint(
                        painter: _GradientBorderPainter(
                          gradient: isDark
                              ? const LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: [
                                    Color(0xFF7D39EB),
                                    Color(0xFF0A0320)
                                  ],
                                )
                              : const LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: [
                                    Color(0xFFE9E2FA),
                                    Color(0xFF7D39EB)
                                  ],
                                ),
                          borderWidth: 1.5,
                          radius: 16,
                        ),
                        child: Container(
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0x4D000011)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
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
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          child: lot.imageUrl != null
                                              ? Image.network(
                                                  lot.imageUrl!,
                                                  width: 80,
                                                  height: 80,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (_, __, ___) =>
                                                      _lotPlaceholder(),
                                                )
                                              : _lotPlaceholder(),
                                        ),
                                        if (lot.distanceKm != null)
                                          Positioned(
                                            bottom: 6,
                                            left: 6,
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 5,
                                                      vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.black
                                                    .withOpacity(0.65),
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                '${lot.distanceKm!.toStringAsFixed(1)} km',
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 10,
                                                    fontWeight:
                                                        FontWeight.w600),
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),

                                    const SizedBox(width: 12),

                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(lot.name,
                                                    style: TextStyle(
                                                        color: textPrimary,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        fontSize: 16)),
                                              ),
                                              Text(
                                                lot.hourlyRate == 0
                                                    ? 'Free'
                                                    : 'EGP ${lot.hourlyRate.toStringAsFixed(lot.hourlyRate.truncateToDouble() == lot.hourlyRate ? 0 : 2)} /hr',
                                                style: TextStyle(
                                                    color: isDark
                                                        ? AppColors.accentGreen
                                                        : const Color(
                                                            0xFF16A34A),
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.w600),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(lot.address,
                                              style: TextStyle(
                                                  color: textSecondary,
                                                  fontSize: 11),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis),
                                          const SizedBox(height: 8),
                                          Text(availLabel,
                                              style: TextStyle(
                                                  color: availColor,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500)),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                  child: LinearProgressIndicator(
                                                    value: lot.total == 0
                                                        ? 0
                                                        : 1 - (lot.available / lot.total),
                                                    backgroundColor:
                                                        const Color(0xFF1E1E3A),
                                                    valueColor:
                                                        AlwaysStoppedAnimation<Color>(
                                                            availColor),
                                                    minHeight: 5,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text('${lot.available} spots',
                                                  style: TextStyle(
                                                      color: textSecondary,
                                                      fontSize: 11)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // View Details button.
                              GestureDetector(
                                onTap: () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => ParkingDetailsScreen(
                                      lotId: lot.id,
                                      distanceKm: lot.distanceKm,
                                    ),
                                  ),
                                ),
                                child: Container(
                                  width: double.infinity,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 9),
                                  decoration: BoxDecoration(
                                    color: Colors.transparent,
                                    border: Border(
                                      top: BorderSide(
                                        color: const Color(0xFF7D39EB)
                                            .withOpacity(0.3),
                                        width: 1,
                                      ),
                                    ),
                                    borderRadius: const BorderRadius.vertical(
                                        bottom: Radius.circular(16)),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text('View Details',
                                          style: TextStyle(
                                              color: Color(0xFF7D39EB),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600)),
                                      SizedBox(width: 6),
                                      Icon(Icons.arrow_forward,
                                          color: Color(0xFF7D39EB), size: 14),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
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
