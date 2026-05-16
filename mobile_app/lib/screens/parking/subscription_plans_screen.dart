import 'package:flutter/material.dart';
import '../../models/parking_lot_model.dart';
import '../../services/parking_service.dart';
import '../../theme/app_colors.dart';

class SubscriptionPlansScreen extends StatefulWidget {
  final String lotId;
  final String lotName;

  const SubscriptionPlansScreen({
    super.key,
    required this.lotId,
    required this.lotName,
  });

  @override
  State<SubscriptionPlansScreen> createState() => _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  List<SubscriptionPlan>? _plans;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final plans = await ParkingService.getSubscriptionPlans(widget.lotId);
      setState(() { _plans = plans; });
    } catch (_) {
      setState(() { _error = 'Could not load subscription plans. Please try again.'; });
    } finally {
      setState(() { _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Column(
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
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Parking Subscriptions',
                            style: TextStyle(
                                color: textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w700)),
                        Text(widget.lotName,
                            style: TextStyle(color: textSecondary, fontSize: 12),
                            overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Save more by subscribing instead of paying hourly.',
                style: TextStyle(color: textSecondary, fontSize: 13),
              ),
            ),

            const SizedBox(height: 16),

            Expanded(
              child: _buildBody(surface, border, textPrimary, textSecondary, isDark),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(Color surface, Color border, Color textPrimary,
      Color textSecondary, bool isDark) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, color: textSecondary, size: 48),
              const SizedBox(height: 12),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: textSecondary, fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _load,
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
    if (_plans == null || _plans!.isEmpty) {
      return Center(
        child: Text('No subscription plans available.',
            style: TextStyle(color: textSecondary, fontSize: 14)),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      itemCount: _plans!.length,
      separatorBuilder: (_, index) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _PlanCard(
        plan: _plans![i],
        surface: surface,
        border: border,
        textPrimary: textPrimary,
        textSecondary: textSecondary,
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final Color surface;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;

  const _PlanCard({
    required this.plan,
    required this.surface,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.card_membership_outlined,
                color: AppColors.purple, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(plan.name,
                    style: TextStyle(
                        color: textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(plan.durationLabel,
                    style: TextStyle(color: AppColors.purple, fontSize: 12)),
                if (plan.description != null && plan.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(plan.description!,
                      style: TextStyle(color: textSecondary, fontSize: 12)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                plan.price == 0
                    ? 'Free'
                    : '${plan.price.toStringAsFixed(plan.price.truncateToDouble() == plan.price ? 0 : 2)} EGP',
                style: TextStyle(
                    color: textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700),
              ),
              Text('/ ${plan.durationLabel.toLowerCase()}',
                  style: TextStyle(color: textSecondary, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
