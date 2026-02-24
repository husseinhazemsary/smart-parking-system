// Alerts Setup bottom sheet — configures spot availability notifications.
// Open via showAlertsSetupSheet(context, locationName).
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

void showAlertsSetupSheet(BuildContext context, String locationName) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    enableDrag: true,
    backgroundColor: Colors.transparent,
    builder: (_) => DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 1.0,
      expand: false,
      builder: (_, scrollController) => _AlertsSetupSheet(
        locationName: locationName,
        scrollController: scrollController,
      ),
    ),
  );
}

class _AlertsSetupSheet extends StatefulWidget {
  final String locationName;
  final ScrollController scrollController;
  const _AlertsSetupSheet({required this.locationName, required this.scrollController});
  @override
  State<_AlertsSetupSheet> createState() => _AlertsSetupSheetState();
}

class _AlertsSetupSheetState extends State<_AlertsSetupSheet> {
  int _triggerIndex = 1;
  int _minSpots = 5;
  double _durationSlider = 2;
  final List<String> _durationLabels = ['30 min', '1 hour', '2 hours', '4 hours', '8 hours'];
  String _expiresIn = '1 Hour';
  bool _quietHours = false;
  bool _pushNotification = true;
  bool _sound = false;
  bool _vibrate = false;
  final List<String> _expiryOptions = ['30 Min', '1 Hour', '2 Hours', '4 Hours', '24 Hours'];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewPadding.bottom + 20),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        controller: widget.scrollController,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text('Alerts Setup', style: TextStyle(color: textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(widget.locationName, style: TextStyle(color: textSecondary, fontSize: 13)),
            const SizedBox(height: 20),

            _SectionLabel(label: 'TRIGGER CONDITION', textSecondary: textSecondary),
            const SizedBox(height: 10),

            _TriggerOption(
              selected: _triggerIndex == 0, isDark: isDark, border: border, surface: surface,
              onTap: () => setState(() => _triggerIndex = 0),
              child: Text('When a spot becomes available', style: TextStyle(color: textPrimary, fontSize: 14)),
            ),
            const SizedBox(height: 8),

            // Threshold option with expandable controls.
            _TriggerOption(
              selected: _triggerIndex == 1, isDark: isDark, border: border, surface: surface,
              onTap: () => setState(() => _triggerIndex = 1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('When availability reaches threshold', style: TextStyle(color: textPrimary, fontSize: 14)),
                  if (_triggerIndex == 1) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text('Minimum spots', style: TextStyle(color: textSecondary, fontSize: 13)),
                        const Spacer(),
                        _Stepper(
                          value: _minSpots,
                          onDecrement: _minSpots > 1 ? () => setState(() => _minSpots--) : null,
                          onIncrement: () => setState(() => _minSpots++),
                          isDark: isDark,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text('Check duration', style: TextStyle(color: textSecondary, fontSize: 13)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.purple, borderRadius: BorderRadius.circular(8)),
                          child: Text(_durationLabels[_durationSlider.round()],
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppColors.purple,
                        inactiveTrackColor: border,
                        thumbColor: AppColors.purple,
                        overlayColor: AppColors.purple.withOpacity(0.15),
                        trackHeight: 3,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                      ),
                      child: Slider(
                        value: _durationSlider, min: 0, max: 4, divisions: 4,
                        onChanged: (v) => setState(() => _durationSlider = v),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),

            _TriggerOption(
              selected: _triggerIndex == 2, isDark: isDark, border: border, surface: surface,
              onTap: () => setState(() => _triggerIndex = 2),
              child: Text('When EV/Accessible spot is available', style: TextStyle(color: textPrimary, fontSize: 14)),
            ),
            const SizedBox(height: 20),

            _SectionLabel(label: 'CONFIGURATION', textSecondary: textSecondary),
            const SizedBox(height: 10),

            // Alert expires in.
            _ConfigCard(isDark: isDark, border: border, surface: surface,
              child: GestureDetector(
                onTap: () async {
                  final picked = await showDialog<String>(
                    context: context,
                    builder: (_) => _PickerDialog(options: _expiryOptions, selected: _expiresIn, isDark: isDark),
                  );
                  if (picked != null) setState(() => _expiresIn = picked);
                },
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppColors.purple.withOpacity(0.15), shape: BoxShape.circle),
                      child: const Icon(Icons.timer_outlined, color: AppColors.purple, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Text('Alert expires in', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
                    const Spacer(),
                    Text(_expiresIn, style: TextStyle(color: textSecondary, fontSize: 13)),
                    const SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down, color: textSecondary, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Quiet Hours.
            _ConfigCard(isDark: isDark, border: border, surface: surface,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Color(0xFF1E3A5F), shape: BoxShape.circle),
                    child: const Icon(Icons.nightlight_round, color: Color(0xFF60A5FA), size: 16),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Quiet Hours', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
                        Text('Mute 10PM - 7AM', style: TextStyle(color: textSecondary, fontSize: 11)),
                      ],
                    ),
                  ),
                  Switch(value: _quietHours, onChanged: (v) => setState(() => _quietHours = v), activeColor: AppColors.purple),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Push Notification with Sound/Vibrate sub-toggles.
            _ConfigCard(isDark: isDark, border: border, surface: surface,
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: AppColors.purple.withOpacity(0.15), shape: BoxShape.circle),
                        child: const Icon(Icons.notifications_outlined, color: AppColors.purple, size: 16),
                      ),
                      const SizedBox(width: 12),
                      Text('Push Notification', style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
                      const Spacer(),
                      Switch(value: _pushNotification, onChanged: (v) => setState(() => _pushNotification = v), activeColor: AppColors.purple),
                    ],
                  ),
                  if (_pushNotification) ...[
                    Divider(color: border, height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Row(children: [
                            Text('Sound', style: TextStyle(color: textSecondary, fontSize: 13)),
                            const SizedBox(width: 8),
                            Switch(value: _sound, onChanged: (v) => setState(() => _sound = v), activeColor: AppColors.purple),
                          ]),
                        ),
                        Expanded(
                          child: Row(children: [
                            Text('Vibrate', style: TextStyle(color: textSecondary, fontSize: 13)),
                            const SizedBox(width: 8),
                            Switch(value: _vibrate, onChanged: (v) => setState(() => _vibrate = v), activeColor: AppColors.purple),
                          ]),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple, foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              child: const Text('Enable Alerts'),
            ),
            const SizedBox(height: 10),
            Center(
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Text('Cancel', style: TextStyle(color: textSecondary, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TriggerOption extends StatelessWidget {
  final bool selected;
  final bool isDark;
  final Color border;
  final Color surface;
  final VoidCallback onTap;
  final Widget child;
  const _TriggerOption({required this.selected, required this.isDark, required this.border, required this.surface, required this.onTap, required this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.purple : border, width: selected ? 1.5 : 1),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 20, height: 20,
              margin: const EdgeInsets.only(top: 1, right: 12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: selected ? AppColors.purple : border, width: 2),
                color: selected ? AppColors.purple : Colors.transparent,
              ),
              child: selected ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
            ),
            Expanded(child: child),
          ],
        ),
      ),
    );
  }
}

class _Stepper extends StatelessWidget {
  final int value;
  final VoidCallback? onDecrement;
  final VoidCallback onIncrement;
  final bool isDark;
  const _Stepper({required this.value, required this.onDecrement, required this.onIncrement, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    return Row(
      children: [
        GestureDetector(
          onTap: onDecrement,
          child: Container(
            width: 28, height: 28,
            decoration: BoxDecoration(border: Border.all(color: border), borderRadius: BorderRadius.circular(8)),
            child: Icon(Icons.remove, size: 14, color: onDecrement != null ? textPrimary : AppColors.textSecondaryDark),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('$value', style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
        ),
        GestureDetector(
          onTap: onIncrement,
          child: Container(
            width: 28, height: 28,
            decoration: BoxDecoration(border: Border.all(color: border), borderRadius: BorderRadius.circular(8)),
            child: Icon(Icons.add, size: 14, color: textPrimary),
          ),
        ),
      ],
    );
  }
}

class _ConfigCard extends StatelessWidget {
  final bool isDark;
  final Color border;
  final Color surface;
  final Widget child;
  const _ConfigCard({required this.isDark, required this.border, required this.surface, required this.child});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: border)),
    child: child,
  );
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final Color textSecondary;
  const _SectionLabel({required this.label, required this.textSecondary});

  @override
  Widget build(BuildContext context) => Text(label,
      style: TextStyle(color: textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2));
}

class _PickerDialog extends StatelessWidget {
  final List<String> options;
  final String selected;
  final bool isDark;
  const _PickerDialog({required this.options, required this.selected, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    return Dialog(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: options.map((o) => ListTile(
            title: Text(o, style: TextStyle(color: textPrimary, fontWeight: o == selected ? FontWeight.w700 : FontWeight.w400)),
            trailing: o == selected ? const Icon(Icons.check, color: AppColors.purple) : null,
            onTap: () => Navigator.of(context).pop(o),
          )).toList(),
        ),
      ),
    );
  }
}