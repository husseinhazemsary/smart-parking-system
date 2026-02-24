import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'navigation_screen.dart';

enum _SlotType { standard, accessible, ev, occupied }

class _Slot {
  final String id;
  final _SlotType type;
  final bool occupied;
  final bool selected;
  const _Slot({required this.id, required this.type, this.occupied = false, this.selected = false});

  _Slot copyWith({bool? selected}) => _Slot(id: id, type: type, occupied: occupied, selected: selected ?? this.selected);
}

class ViewSlotsScreen extends StatefulWidget {
  final String locationName;
  final String zone;
  const ViewSlotsScreen({super.key, required this.locationName, required this.zone});

  @override
  State<ViewSlotsScreen> createState() => _ViewSlotsScreenState();
}

class _ViewSlotsScreenState extends State<ViewSlotsScreen> {
  int _levelIndex = 0;
  final List<String> _levels = ['Level B1', 'Level B2', 'Level G'];
  String? _selectedSlotId;

  final List<List<_Slot>> _grid = [
    [
      _Slot(id: 'A1', type: _SlotType.accessible),
      _Slot(id: 'A2', type: _SlotType.accessible),
      _Slot(id: 'A3', type: _SlotType.occupied, occupied: true),
      _Slot(id: 'A4', type: _SlotType.occupied, occupied: true),
    ],
    [
      _Slot(id: 'A5', type: _SlotType.accessible),
      _Slot(id: 'A6', type: _SlotType.accessible),
      _Slot(id: 'A7', type: _SlotType.occupied, occupied: true),
      _Slot(id: 'A8', type: _SlotType.occupied, occupied: true),
    ],
    [
      _Slot(id: 'B1', type: _SlotType.standard),
      _Slot(id: 'B2', type: _SlotType.standard),
      _Slot(id: 'B4', type: _SlotType.standard),
      _Slot(id: 'B3', type: _SlotType.standard),
    ],
    [
      _Slot(id: 'C1', type: _SlotType.ev),
      _Slot(id: 'C2', type: _SlotType.standard),
      _Slot(id: 'C3', type: _SlotType.occupied, occupied: true),
      _Slot(id: 'C4', type: _SlotType.occupied, occupied: true),
    ],
    [
      _Slot(id: 'D1', type: _SlotType.ev),
      _Slot(id: 'D2', type: _SlotType.standard),
      _Slot(id: 'D3', type: _SlotType.standard),
      _Slot(id: 'D4', type: _SlotType.occupied, occupied: true),
    ],
    [
      _Slot(id: 'D5', type: _SlotType.ev),
      _Slot(id: 'D6', type: _SlotType.standard),
      _Slot(id: 'D7', type: _SlotType.standard),
      _Slot(id: 'D8', type: _SlotType.occupied, occupied: true),
    ],
  ];

  _Slot? get _selectedSlot {
    if (_selectedSlotId == null) return null;
    for (final row in _grid) {
      for (final slot in row) {
        if (slot.id == _selectedSlotId) return slot;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    final slotsFlat = _grid.expand((r) => r).toList();

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Column(
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.locationName,
                    style: TextStyle(color: textPrimary, fontSize: 22, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(widget.zone, style: TextStyle(color: textSecondary, fontSize: 13)),
                ],
              ),
            ),
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
                  children: _levels.asMap().entries.map((e) {
                    final active = _levelIndex == e.key;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _levelIndex = e.key),
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
                            e.value,
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
            const SizedBox(height: 22),
            Text('Entrance', style: TextStyle(color: textSecondary, fontSize: 12, letterSpacing: 0.5)),
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

            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GridView.builder(
                  padding: const EdgeInsets.only(bottom: 6),
                  itemCount: slotsFlat.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    crossAxisSpacing: 6,
                    mainAxisSpacing: 6,
                    childAspectRatio: 1.55, // close to 44px height feel
                  ),
                  itemBuilder: (context, index) {
                    final slot = slotsFlat[index];
                    final isSelected = _selectedSlotId == slot.id;

                    return GestureDetector(
                      onTap: () => setState(() {
                        _selectedSlotId = isSelected ? null : slot.id;
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.grey.shade400 : _slotColor(slot.type, slot.occupied),
                          borderRadius: BorderRadius.circular(8),
                          border: isSelected ? Border.all(color: Colors.white, width: 2) : null,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (slot.type == _SlotType.accessible)
                              const Icon(Icons.accessible, color: Colors.white, size: 14)
                            else if (slot.type == _SlotType.ev)
                              const Icon(Icons.bolt, color: Colors.white, size: 14)
                            else if (slot.type == _SlotType.occupied)
                                const Icon(Icons.directions_car, color: Colors.white54, size: 14),
                            Text(
                              slot.id,
                              style: TextStyle(
                                color: slot.occupied ? Colors.white38 : Colors.white,
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

            AnimatedSize(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
              child: _selectedSlot != null
                  ? _SlotDetailPanel(
                slot: _selectedSlot!,
                isDark: isDark,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
                surface: surface,
                border: border,
                onCancel: () => setState(() => _selectedSlotId = null),
                onNavigate: _selectedSlot!.occupied
                    ? null
                    : () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => NavigationScreen(destinationName: widget.locationName),
                  ),
                ),
              )
                  : _SlotEmptyState(isDark: isDark, textSecondary: textSecondary, border: border, surface: surface),
            ),
          ],
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
        return const Color(0xFF1A3A2A);
      case _SlotType.occupied:
        return const Color(0xFF3D1A1A);
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
        return const Color(0xFF1A3A2A);
      case _SlotType.occupied:
        return const Color(0xFF3D1A1A);
    }
  }
}

class _LegendRow extends StatelessWidget {
  final Color textSecondary;
  final Color freeColor;
  final Color occupiedColor;
  final Color evColor;
  final Color accessibleColor;

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
  final Color color;
  final String label;
  final Color textSecondary;

  const _LegendItem({required this.color, required this.label, required this.textSecondary});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: textSecondary, fontSize: 11, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _SlotEmptyState extends StatelessWidget {
  final bool isDark;
  final Color textSecondary;
  final Color border;
  final Color surface;
  const _SlotEmptyState({required this.isDark, required this.textSecondary, required this.border, required this.surface});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewPadding.bottom + 16),
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
            child: const Icon(Icons.touch_app_outlined, color: AppColors.purple, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select a spot',
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Tap any available spot on the map to view details or navigate to it.',
                  style: TextStyle(color: textSecondary, fontSize: 12),
                ),
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
  final Color textPrimary;
  final Color textSecondary;
  final Color surface;
  final Color border;
  final VoidCallback onCancel;
  final VoidCallback? onNavigate;
  const _SlotDetailPanel({
    required this.slot,
    required this.isDark,
    required this.textPrimary,
    required this.textSecondary,
    required this.surface,
    required this.border,
    required this.onCancel,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewPadding.bottom + 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
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
                  Text('Slot ${slot.id}', style: TextStyle(color: textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  _TypeLine(slot: slot, textSecondary: textSecondary),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: (slot.occupied ? const Color(0xFFEF4444) : const Color(0xFF22C55E)).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: (slot.occupied ? const Color(0xFFEF4444) : const Color(0xFF22C55E)).withOpacity(0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, color: slot.occupied ? const Color(0xFFEF4444) : const Color(0xFF22C55E), size: 7),
                    const SizedBox(width: 5),
                    Text(
                      slot.occupied ? 'OCCUPIED' : 'AVAILABLE',
                      style: TextStyle(
                        color: slot.occupied ? const Color(0xFFEF4444) : const Color(0xFF22C55E),
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
            _PredictionLine(isDark: isDark, textPrimary: textPrimary, textSecondary: textSecondary, slotId: slot.id),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Container(
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
                        child: const Icon(Icons.elevator_outlined, color: AppColors.purple, size: 14),
                      ),
                      const SizedBox(height: 8),
                      Text('Distance to Lift', style: TextStyle(color: textSecondary, fontSize: 11)),
                      const SizedBox(height: 2),
                      Text('15 meters', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
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
                        child: const Icon(Icons.attach_money, color: AppColors.purple, size: 14),
                      ),
                      const SizedBox(height: 8),
                      Text('Hourly Rate', style: TextStyle(color: textSecondary, fontSize: 11)),
                      const SizedBox(height: 2),
                      Text('15 EGP /hr', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onCancel,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text('Cancel', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
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
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
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
  final Color textPrimary;
  final Color textSecondary;
  final String slotId;
  const _PredictionLine({required this.isDark, required this.textPrimary, required this.textSecondary, required this.slotId});

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
        border: Border.all(color: isDark ? AppColors.borderDark : const Color(0xFFFDE68A)),
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
                Text(
                  'Predicted availability: ${_predictedAvailability()}',
                  style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'This is only a prediction and may be inaccurate.',
                  style: TextStyle(color: textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}