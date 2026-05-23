import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../models/parking_lot_model.dart';
import '../../providers/parking_provider.dart';
import '../../providers/locale_provider.dart';
import '../../theme/app_colors.dart';
import 'parking_details_screen.dart';

enum _SortOption { nearest, mostAvailable, lowestRate, highestRate }

class SelectLocationScreen extends StatefulWidget {
  final String? initialQuery;
  const SelectLocationScreen({super.key, this.initialQuery});

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  int _categoryIndex = 0;
  _SortOption _sortOption = _SortOption.nearest;
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialQuery ?? '');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchLots();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  static const _categoryFilters = [
    null,
    LotCategory.mall,
    LotCategory.university,
    LotCategory.airport,
    LotCategory.street,
  ];

  List<String> _categoryKeys(AppLocalizations l10n) => [
        l10n.categoryAll,
        l10n.categoryMalls,
        l10n.categoryUniversities,
        l10n.categoryAirports,
        l10n.categoryStreets,
      ];

  bool _matchesCategory(ParkingLotSummary lot, int index) {
    final filter = _categoryFilters[index];
    return filter == null || lot.category == filter;
  }

  List<ParkingLotSummary> _applySort(List<ParkingLotSummary> lots) {
    final sorted = List<ParkingLotSummary>.from(lots);
    switch (_sortOption) {
      case _SortOption.nearest:
        sorted.sort((a, b) {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm!.compareTo(b.distanceKm!);
        });
      case _SortOption.mostAvailable:
        sorted.sort((a, b) {
          final aRatio = a.total == 0 ? 0.0 : a.available / a.total;
          final bRatio = b.total == 0 ? 0.0 : b.available / b.total;
          return bRatio.compareTo(aRatio);
        });
      case _SortOption.lowestRate:
        sorted.sort((a, b) => a.hourlyRate.compareTo(b.hourlyRate));
      case _SortOption.highestRate:
        sorted.sort((a, b) => b.hourlyRate.compareTo(a.hourlyRate));
    }
    return sorted;
  }

  void _showSortSheet(BuildContext context, AppLocalizations l10n, bool isDark) {
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final options = [
      (_SortOption.nearest, l10n.sortNearest),
      (_SortOption.mostAvailable, l10n.sortMostAvailable),
      (_SortOption.lowestRate, l10n.sortLowestRate),
      (_SortOption.highestRate, l10n.sortHighestRate),
    ];

    var selected = _sortOption;

    showModalBottomSheet(
      context: context,
      backgroundColor: surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.sortBy,
                  style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              ...options.map((entry) {
                final (opt, label) = entry;
                final isSelected = selected == opt;
                return GestureDetector(
                  onTap: () => setSheetState(() => selected = opt),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.purple.withOpacity(0.12)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? AppColors.purple : (isDark ? AppColors.borderDark : AppColors.borderLight),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(label,
                              style: TextStyle(
                                  color: isSelected ? AppColors.purple : textPrimary,
                                  fontSize: 15,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400)),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle, color: AppColors.purple, size: 20),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() => _sortOption = selected);
                    Navigator.of(ctx).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.purple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(l10n.apply,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
    final l10n = AppLocalizations.of(context)!;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final categories = _categoryKeys(l10n);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
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
                    child: Text(l10n.selectLocationTitle,
                        style: TextStyle(
                            color: textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.w700)),
                  ),
                  GestureDetector(
                    onTap: () => _showSortSheet(context, l10n, isDark),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: _sortOption != _SortOption.nearest
                            ? AppColors.purple
                            : surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _sortOption != _SortOption.nearest
                              ? AppColors.purple
                              : border,
                        ),
                      ),
                      child: Icon(
                        Icons.tune,
                        size: 20,
                        color: _sortOption != _SortOption.nearest
                            ? Colors.white
                            : textPrimary,
                      ),
                    ),
                  ),
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
                        autofocus: widget.initialQuery != null,
                        style: TextStyle(color: textPrimary, fontSize: 14),
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          hintText: l10n.searchAddressHint,
                          hintStyle: TextStyle(color: textSecondary, fontSize: 14),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                    if (_searchController.text.isNotEmpty)
                      GestureDetector(
                        onTap: () => setState(() => _searchController.clear()),
                        child: Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: Icon(Icons.close, color: textSecondary, size: 18),
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
                itemCount: categories.length,
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
                        categories[i],
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

            // Lot list.
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
                            Icon(Icons.error_outline, color: textSecondary, size: 48),
                            const SizedBox(height: 12),
                            Text(provider.lotsError!,
                                textAlign: TextAlign.center,
                                style: TextStyle(color: textSecondary, fontSize: 14)),
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

                  final isArabic = context.read<LocaleProvider>().isArabic;
                  final query = _searchController.text.toLowerCase();

                  final filtered = provider.lots.where((lot) {
                    if (query.isNotEmpty &&
                        !lot.name.toLowerCase().contains(query) &&
                        !(lot.nameAr ?? '').toLowerCase().contains(query) &&
                        !lot.address.toLowerCase().contains(query) &&
                        !(lot.addressAr ?? '').toLowerCase().contains(query)) {
                      return false;
                    }
                    if (!_matchesCategory(lot, _categoryIndex)) return false;
                    return true;
                  }).toList();

                  final sorted = _applySort(filtered);

                  if (sorted.isEmpty) {
                    return Center(
                      child: Text(l10n.noLotsFound,
                          style: TextStyle(color: textSecondary, fontSize: 14)),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: sorted.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 20),
                    itemBuilder: (_, i) {
                      final lot = sorted[i];
                      final (availLabel, availColor) = _availability(lot);

                      return CustomPaint(
                        painter: _GradientBorderPainter(
                          gradient: isDark
                              ? const LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: [Color(0xFF7D39EB), Color(0xFF0A0320)],
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
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0x4D000011) : Colors.white,
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
                                          borderRadius: BorderRadius.circular(10),
                                          child: lot.imageUrl != null
                                              ? Image.network(
                                                  lot.imageUrl!,
                                                  width: 80,
                                                  height: 80,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (_, __, ___) => _lotPlaceholder(),
                                                )
                                              : _lotPlaceholder(),
                                        ),
                                        if (lot.distanceKm != null)
                                          Positioned(
                                            bottom: 6,
                                            left: 6,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 5, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withOpacity(0.65),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                '${lot.distanceKm!.toStringAsFixed(1)} km',
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
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(lot.localizedName(isArabic),
                                                    style: TextStyle(
                                                        color: textPrimary,
                                                        fontWeight: FontWeight.w600,
                                                        fontSize: 16)),
                                              ),
                                              Text(
                                                lot.hourlyRate == 0
                                                    ? l10n.free
                                                    : 'EGP ${lot.hourlyRate.toStringAsFixed(lot.hourlyRate.truncateToDouble() == lot.hourlyRate ? 0 : 2)} /hr',
                                                style: TextStyle(
                                                    color: isDark
                                                        ? AppColors.accentGreen
                                                        : const Color(0xFF16A34A),
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(lot.localizedAddress(isArabic),
                                              style: TextStyle(
                                                  color: textSecondary, fontSize: 11),
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
                                                  borderRadius: BorderRadius.circular(4),
                                                  child: LinearProgressIndicator(
                                                    value: lot.total == 0
                                                        ? 0
                                                        : 1 - (lot.available / lot.total),
                                                    backgroundColor: const Color(0xFF1E1E3A),
                                                    valueColor: AlwaysStoppedAnimation<Color>(
                                                        availColor),
                                                    minHeight: 5,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text('${lot.available} spots',
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
                                  padding: const EdgeInsets.symmetric(vertical: 9),
                                  decoration: BoxDecoration(
                                    color: Colors.transparent,
                                    border: Border(
                                      top: BorderSide(
                                        color: const Color(0xFF7D39EB).withOpacity(0.3),
                                        width: 1,
                                      ),
                                    ),
                                    borderRadius: const BorderRadius.vertical(
                                        bottom: Radius.circular(16)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(l10n.viewDetails,
                                          style: const TextStyle(
                                              color: Color(0xFF7D39EB),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600)),
                                      const SizedBox(width: 6),
                                      const Icon(Icons.arrow_forward,
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
