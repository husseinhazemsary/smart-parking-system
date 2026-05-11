// Reservation sheet — handles both success and failure outcomes in one place.
// Call showReservationSheet(context, success: true) or (context, success: false).
// Success: animated green checkmark + 10-minute countdown timer.
// Failure: animated red X + error message + retry button.
import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

void showReservationSheet(BuildContext context, {required bool success, String? errorMessage}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    // Only block dismissal on success — failure can be swiped away.
    isDismissible: !success,
    backgroundColor: Colors.transparent,
    builder: (_) => _ReservationSheet(
      success: success,
      errorMessage: errorMessage ?? 'Something went wrong. Please try again.',
    ),
  );
}

class _ReservationSheet extends StatefulWidget {
  final bool success;
  final String errorMessage;
  const _ReservationSheet({required this.success, required this.errorMessage});

  @override
  State<_ReservationSheet> createState() => _ReservationSheetState();
}

class _ReservationSheetState extends State<_ReservationSheet>
    with SingleTickerProviderStateMixin {
  // Countdown only used on success.
  int _secondsLeft = 10 * 60;
  Timer? _timer;
  late AnimationController _scaleController;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    // Entrance pop animation for the icon circle.
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
    _scaleAnim = CurvedAnimation(parent: _scaleController, curve: Curves.elasticOut);
    _scaleController.forward();

    // Tick countdown only on success.
    if (widget.success) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        setState(() {
          if (_secondsLeft > 0) _secondsLeft--;
        });
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scaleController.dispose();
    super.dispose();
  }

  String get _formattedCountdown {
    final m = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final s = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$m:$s:00';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    // State-specific values.
    final iconColor = widget.success ? const Color(0xFF22C55E) : Colors.redAccent;
    final iconData = widget.success ? Icons.check_rounded : Icons.close_rounded;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).viewPadding.bottom + 32),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle.
          Container(
            width: 40, height: 4,
            margin: const EdgeInsets.only(bottom: 32),
            decoration: BoxDecoration(color: border, borderRadius: BorderRadius.circular(2)),
          ),

          // Animated icon circle — green check on success, red X on failure.
          ScaleTransition(
            scale: _scaleAnim,
            child: Container(
              width: 96, height: 96,
              decoration: BoxDecoration(color: iconColor, shape: BoxShape.circle),
              child: Icon(iconData, color: Colors.white, size: 52),
            ),
          ),

          const SizedBox(height: 24),

          // Primary message.
          Text(
            widget.success ? 'Reserved a spot\nsuccessfully!' : 'Reservation failed',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: iconColor,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              height: 1.3,
            ),
          ),

          const SizedBox(height: 12),

          // Secondary message.
          Text(
            widget.success
                ? 'Your spot is being held for 10 minutes.'
                : widget.errorMessage,
            textAlign: TextAlign.center,
            style: TextStyle(color: textSecondary, fontSize: 14, height: 1.4),
          ),

          // Countdown — success only.
          if (widget.success) ...[
            const SizedBox(height: 28),
            Text(
              'Time remaining till\nreservation expires:',
              textAlign: TextAlign.center,
              style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w600, height: 1.4),
            ),
            const SizedBox(height: 12),
            Text(
              '$_formattedCountdown mins',
              style: TextStyle(
                color: textPrimary,
                fontSize: 28,
                fontWeight: FontWeight.w700,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],

          const SizedBox(height: 32),

          // Primary CTA.
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: widget.success ? AppColors.purple : Colors.redAccent,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            child: Text(widget.success ? 'Got it' : 'Try Again'),
          ),

          // Cancel option — failure only.
          if (!widget.success) ...[
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Text('Cancel', style: TextStyle(color: textSecondary, fontSize: 14)),
            ),
          ],
        ],
      ),
    );
  }
}