import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/parking_slot_model.dart';
import '../../providers/parking_provider.dart';
import '../../providers/user_prefs_provider.dart';
import '../../theme/app_colors.dart';
import 'navigation_screen.dart';

enum _SlotType { standard, accessible, ev, occupied }

class _Slot {
  final String id;
  final _SlotType type;
  final bool occupied;
  final bool selected;
  const _Slot(
      {required this.id,
      required this.type,
      this.occupied = false,
      this.selected = false});

  _Slot copyWith({bool? selected}) =>
      _Slot(id: id, type: type, occupied: occupied, selected: selected ?? this.selected);
}

_Slot _fromModel(ParkingSlotModel m) {
  _SlotType type;
  switch (m.slotType) {
    case ParkingSlotType.disabled:
      type = _SlotType.accessible;
    case ParkingSlotType.ev:
      type = _SlotType.ev;
    case ParkingSlotType.regular:
      type = m.isOccupied ? _SlotType.occupied : _SlotType.standard;
  }
  return _Slot(id: m.slotLabel, type: type, occupied: m.isOccupied);
}

String _levelOf(String label) =>
    label.replaceAll(RegExp(r'\d+$'), '').toUpperCase().isEmpty
        ? 'A'
        : label.replaceAll(RegExp(r'\d+$'), '').toUpperCase();

class ViewSlotsScreen extends StatefulWidget {
  final String locationName;
  final String lotId;
  const ViewSlotsScreen(
      {super.key, required this.locationName, required this.lotId});

  @override
  State<ViewSlotsScreen> createState() => _ViewSlotsScreenState();
}

class _ViewSlotsScreenState extends State<ViewSlotsScreen> {
  int _levelIndex = 0;
  String? _selectedSlotId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchSlots(widget.lotId);
    });
  }

  void _onSlotTap(_Slot slot) {
    setState(() {
      _selectedSlotId = (_selectedSlotId == slot.id) ? null : slot.id;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final userPrefs = context.watch<UserPrefsProvider>();

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Consumer<ParkingProvider>(
          builder: (context, provider, _) {
            final isLoading = provider.isLoadingSlots(widget.lotId);
            final error = provider.slotError(widget.lotId);
            final rawSlots = provider.slotsFor(widget.lotId);

            // ── Loading ──────────────────────────────────────────────────
            if (isLoading && rawSlots == null) {
              return Column(
                children: [
                  _Header(
                    locationName: widget.locationName,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    surface: surface,
                    border: border,
                  ),
                  const Expanded(child: Center(child: CircularProgressIndicator())),
                ],
              );
            }

            // ── Error ────────────────────────────────────────────────────
            if (error != null && rawSlots == null) {
              return Column(
                children: [
                  _Header(
                    locationName: widget.locationName,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    surface: surface,
                    border: border,
                  ),
                  Expanded(
                    child: Center(
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
                              onPressed: () => provider.fetchSlots(widget.lotId),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.purple,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            // ── Data ─────────────────────────────────────────────────────
            final slots = (rawSlots ?? []).map(_fromModel).toList();

            // Derive levels from label prefix (A1→A, B2→B, EV1→EV).
            final levelKeys = slots
                .map((s) => _levelOf(s.id))
                .toSet()
                .toList()
              ..sort();

            final currentLevel =
                levelKeys.isEmpty ? null : levelKeys[_levelIndex.clamp(0, levelKeys.length - 1)];

            final visibleSlots = currentLevel == null
                ? slots
                : slots.where((s) => _levelOf(s.id) == currentLevel).toList();

            _Slot? selectedSlot;
            if (_selectedSlotId != null) {
              try {
                selectedSlot = visibleSlots.firstWhere((s) => s.id == _selectedSlotId);
              } catch (_) {
                selectedSlot = null;
              }
            }

            return Column(
              children: [
                // ── Header ───────────────────────────────────────────────
                _Header(
                  locationName: widget.locationName,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  surface: surface,
                  border: border,
                ),

                // ── Level tabs (hidden when only one level) ───────────────
                if (levelKeys.length > 1) ...[
                  const SizedBox(height: 14),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: surface,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: border),
                      ),
                      child: Row(
                        children: levelKeys.asMap().entries.map((e) {
                          final active = _levelIndex == e.key;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() {
                                _levelIndex = e.key;
                                _selectedSlotId = null;
                              }),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                curve: Curves.easeOut,
                                height: 38,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: active ? AppColors.purple : Colors.transparent,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: active ? AppColors.purple : Colors.transparent,
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  'Row ${e.value}',
                                  style: TextStyle(
                                    color: active ? Colors.white : textSecondary,
                                    fontSize: 13,
                                    fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ] else
                  const SizedBox(height: 14),

                Text('Entrance',
                    style: TextStyle(
                        color: textSecondary, fontSize: 12, letterSpacing: 0.5)),
                const SizedBox(height: 10),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _LegendRow(
                    textSecondary: textSecondary,
                    freeColor: _slotColorStatic(_SlotType.standard, false),
                    occupiedColor: _slotColorStatic(_SlotType.occupied, true),
                    evColor: _slotColorStatic(_SlotType.ev, false),
                    accessibleColor: _slotColorStatic(_SlotType.accessible, false),
                  ),
                ),
                const SizedBox(height: 10),

                // ── Slot grid ─────────────────────────────────────────────
                Expanded(
                  child: visibleSlots.isEmpty
                      ? Center(
                          child: Text('No slots available',
                              style: TextStyle(color: textSecondary, fontSize: 14)))
                      : Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: GridView.builder(
                            padding: const EdgeInsets.only(bottom: 6),
                            itemCount: visibleSlots.length,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 4,
                              crossAxisSpacing: 6,
                              mainAxisSpacing: 6,
                              childAspectRatio: 1.55,
                            ),
                            itemBuilder: (context, index) {
                              final slot = visibleSlots[index];
                              final isSelected = _selectedSlotId == slot.id;
                              return GestureDetector(
                                onTap: () => _onSlotTap(slot),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? Colors.grey.shade400
                                        : _slotColor(slot.type, slot.occupied),
                                    borderRadius: BorderRadius.circular(8),
                                    border: isSelected
                                        ? Border.all(color: Colors.white, width: 2)
                                        : null,
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (slot.type == _SlotType.accessible)
                                        const Icon(Icons.accessible,
                                            color: Colors.white, size: 14)
                                      else if (slot.type == _SlotType.ev)
                                        const Icon(Icons.bolt,
                                            color: Colors.white, size: 14)
                                      else if (slot.occupied)
                                        const Icon(Icons.directions_car,
                                            color: Colors.white54, size: 14),
                                      Text(
                                        slot.id,
                                        style: TextStyle(
                                          color: slot.occupied
                                              ? Colors.white38
                                              : Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                ),

                // ── Bottom panel ──────────────────────────────────────────
                AnimatedSize(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOut,
                  child: selectedSlot != null
                      ? _SlotDetailPanel(
                          slot: selectedSlot,
                          isDark: isDark,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                          surface: surface,
                          border: border,
                          hasEV: userPrefs.hasEV,
                          onCancel: () => setState(() => _selectedSlotId = null),
                          onNavigate: selectedSlot.occupied
                              ? null
                              : () {
                                  final s = selectedSlot!;
                                  if (s.type == _SlotType.ev && !userPrefs.hasEV) {
                                    showDialog(
                                      context: context,
                                      builder: (_) => const _EligibilityDialog(
                                        title: 'EV Charging Spot',
                                        message:
                                            'This spot is for electric vehicles only. '
                                            'Add an EV to your profile to navigate here.',
                                        icon: Icons.bolt,
                                      ),
                                    );
                                    return;
                                  }
                                  Navigator.of(context).push(MaterialPageRoute(
                                    builder: (_) => NavigationScreen(
                                        destinationName: widget.locationName),
                                  ));
                                },
                        )
                      : _SlotEmptyState(
                          isDark: isDark,
                          textSecondary: textSecondary,
                          border: border,
                          surface: surface),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Color _slotColor(_SlotType type, bool occupied) {
    if (occupied) return const Color(0xFF3D1A1A);
    switch (type) {
      case _SlotType.accessible:
        return const Color(0xFF1A3A5C);
      case _SlotType.ev:
        return const Color(0xFF2D3A1A);
      case _SlotType.standard:
      case _SlotType.occupied:
        return const Color(0xFF1A3A2A);
    }
  }

  static Color _slotColorStatic(_SlotType type, bool occupied) {
    if (occupied) return const Color(0xFF3D1A1A);
    switch (type) {
      case _SlotType.accessible:
        return const Color(0xFF1A3A5C);
      case _SlotType.ev:
        return const Color(0xFF2D3A1A);
      case _SlotType.standard:
      case _SlotType.occupied:
        return const Color(0xFF1A3A2A);
    }
  }
}

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final String locationName;
  final Color textPrimary, textSecondary, surface, border;
  const _Header({
    required this.locationName,
    required this.textPrimary,
    required this.textSecondary,
    required this.surface,
    required this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: border),
                ),
                child: Icon(Icons.info_outline, size: 16, color: textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            locationName,
            style: TextStyle(
                color: textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

// ── Supporting widgets (unchanged logic) ───────────────────────────────────

class _LegendRow extends StatelessWidget {
  final Color textSecondary, freeColor, occupiedColor, evColor, accessibleColor;
  const _LegendRow({
    required this.textSecondary,
    required this.freeColor,
    required this.occupiedColor,
    required this.evColor,
    required this.accessibleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _LegendItem(color: freeColor, label: 'Free', textSecondary: textSecondary)),
        Expanded(child: _LegendItem(color: occupiedColor, label: 'Occupied', textSecondary: textSecondary)),
        Expanded(child: _LegendItem(color: evColor, label: 'EV', textSecondary: textSecondary)),
        Expanded(child: _LegendItem(color: accessibleColor, label: 'Accessible', textSecondary: textSecondary)),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color, textSecondary;
  final String label;
  const _LegendItem({required this.color, required this.label, required this.textSecondary});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
            width: 10,
            height: 10,
            decoration:
                BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(
                color: textSecondary, fontSize: 11, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _SlotEmptyState extends StatelessWidget {
  final bool isDark;
  final Color textSecondary, border, surface;
  const _SlotEmptyState(
      {required this.isDark,
      required this.textSecondary,
      required this.border,
      required this.surface});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
          20, 16, 20, MediaQuery.of(context).viewPadding.bottom + 16),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: border)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child:
                const Icon(Icons.touch_app_outlined, color: AppColors.purple, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Select a spot',
                    style: TextStyle(
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                    'Tap any available spot on the map to view details or navigate to it.',
                    style: TextStyle(color: textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotDetailPanel extends StatelessWidget {
  final _Slot slot;
  final bool isDark;
  final Color textPrimary, textSecondary, surface, border;
  final bool hasEV;
  final VoidCallback onCancel;
  final VoidCallback? onNavigate;
  const _SlotDetailPanel({
    required this.slot,
    required this.isDark,
    required this.textPrimary,
    required this.textSecondary,
    required this.surface,
    required this.border,
    required this.hasEV,
    required this.onCancel,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 16, 20, MediaQuery.of(context).viewPadding.bottom + 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
            top: BorderSide(
                color: isDark ? AppColors.borderDark : AppColors.borderLight)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: isDark ? AppColors.borderDark : AppColors.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Slot ${slot.id}',
                      style: TextStyle(
                          color: textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  _TypeLine(slot: slot, textSecondary: textSecondary),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: (slot.occupied
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF22C55E))
                      .withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: (slot.occupied
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF22C55E))
                        .withOpacity(0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle,
                        color: slot.occupied
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF22C55E),
                        size: 7),
                    const SizedBox(width: 5),
                    Text(
                      slot.occupied ? 'OCCUPIED' : 'AVAILABLE',
                      style: TextStyle(
                        color: slot.occupied
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF22C55E),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (slot.occupied) ...[
            const SizedBox(height: 10),
            _PredictionLine(
                isDark: isDark,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
                slotId: slot.id),
          ],
          if (slot.type == _SlotType.ev && !hasEV) ...[
            const SizedBox(height: 10),
            _RestrictionBanner(
              isDark: isDark,
              icon: Icons.bolt,
              color: const Color(0xFF22C55E),
              message:
                  'EV charging spots are for electric vehicles only. Add an EV to your profile to use this spot.',
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _InfoTile(icon: Icons.elevator_outlined, label: 'Distance to Lift', value: '–', isDark: isDark, textPrimary: textPrimary, textSecondary: textSecondary)),
              const SizedBox(width: 10),
              Expanded(child: _InfoTile(icon: Icons.attach_money, label: 'Hourly Rate', value: 'See lot detail', isDark: isDark, textPrimary: textPrimary, textSecondary: textSecondary)),
            ],
          ),
          const SizedBox(height: 16),
          if (slot.occupied)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text('Close',
                    style: TextStyle(
                        color: textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text('Cancel',
                        style: TextStyle(
                            color: textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onNavigate,
                    icon: const Icon(Icons.navigation_outlined, size: 16),
                    label: const Text('Navigate'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.purple,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.purple.withOpacity(0.35),
                      disabledForegroundColor: Colors.white.withOpacity(0.6),
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
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final bool isDark;
  final Color textPrimary, textSecondary;
  const _InfoTile({required this.icon, required this.label, required this.value, required this.isDark, required this.textPrimary, required this.textSecondary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.backgroundDark : const Color(0xFFF4F4FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppColors.purple, size: 14),
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: textSecondary, fontSize: 11)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _TypeLine extends StatelessWidget {
  final _Slot slot;
  final Color textSecondary;
  const _TypeLine({required this.slot, required this.textSecondary});

  String _label() {
    switch (slot.type) {
      case _SlotType.accessible:
        return 'Accessible';
      case _SlotType.ev:
        return 'EV Charging';
      case _SlotType.standard:
      case _SlotType.occupied:
        return 'Standard';
    }
  }

  IconData _icon() {
    switch (slot.type) {
      case _SlotType.accessible:
        return Icons.accessible;
      case _SlotType.ev:
        return Icons.bolt;
      case _SlotType.standard:
      case _SlotType.occupied:
        return Icons.local_parking;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(_icon(), size: 14, color: textSecondary),
        const SizedBox(width: 6),
        Text(_label(), style: TextStyle(color: textSecondary, fontSize: 12)),
      ],
    );
  }
}

class _PredictionLine extends StatelessWidget {
  final bool isDark;
  final Color textPrimary, textSecondary;
  final String slotId;
  const _PredictionLine(
      {required this.isDark,
      required this.textPrimary,
      required this.textSecondary,
      required this.slotId});

  String _predictedAvailability() {
    final v = slotId.codeUnits.fold<int>(0, (a, b) => a + b);
    final min = 8 + (v % 10);
    final max = min + 10;
    return '$min–$max min';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.backgroundDark : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isDark ? AppColors.borderDark : const Color(0xFFFDE68A)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, size: 18, color: textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Predicted availability: ${_predictedAvailability()}',
                    style: TextStyle(
                        color: textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('This is only a prediction and may be inaccurate.',
                    style: TextStyle(color: textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RestrictionBanner extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final Color color;
  final String message;
  const _RestrictionBanner(
      {required this.isDark,
      required this.icon,
      required this.color,
      required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.08 : 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message,
                style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _EligibilityDialog extends StatelessWidget {
  final String title, message;
  final IconData icon;
  const _EligibilityDialog(
      {required this.title, required this.message, required this.icon});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    return AlertDialog(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.purple, size: 26),
          ),
          const SizedBox(height: 14),
          Text(title,
              style: TextStyle(
                  color: textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(message,
              style: TextStyle(color: textSecondary, fontSize: 13),
              textAlign: TextAlign.center),
        ],
      ),
      actions: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.purple,
              foregroundColor: Colors.white,
              shape:
                  RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 13),
            ),
            child: const Text('Got it',
                style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    );
  }
}
