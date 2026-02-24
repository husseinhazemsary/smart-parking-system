// Wallet screen — shows saved payment cards, the active parking session
// and recent transaction history.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'add_card_screen.dart';
import '../account/settings_screen.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor:
      isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).maybePop(),
                      child: Icon(Icons.arrow_back, color: textPrimary),
                    ),
                    Text(
                      'Wallet',
                      style: TextStyle(
                        color: textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const SettingsScreen()),
                      ),
                      child: Icon(Icons.settings_outlined,
                          color: textPrimary, size: 22),
                    ),
                  ],
                ),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Payment Methods',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => const AddCardScreen()),
                    ),
                    child: const Text(
                      '+ Add new card',
                      style: TextStyle(
                        color: AppColors.accentGreen,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              SizedBox(
                // Horizontal card carousel — clips to none so the purple border shadow on the
// primary card renders fully without being cut off.
                height: 130,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  children: [
                    _PaymentCard(
                      isDark: isDark,
                      isPrimary: true,
                      cardType: 'VISA',
                      lastFour: '1234',
                      expiry: '09/27',
                    ),
                    const SizedBox(width: 12),
                    _PaymentCard(
                      isDark: isDark,
                      isPrimary: false,
                      cardType: 'MC',
                      lastFour: null,
                      expiry: null,
                    ),
                    const SizedBox(width: 12),

                    GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const AddCardScreen()),
                      ),
                      child: Container(
                        width: 200,
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.surfaceDark
                              : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.accentGreen.withOpacity(0.4),
                          ),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add, color: AppColors.accentGreen, size: 26),
                              SizedBox(height: 6),
                              Text(
                                'Add card',
                                style: TextStyle(
                                  color: AppColors.accentGreen,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              Row(
                children: [
                  Text(
                    'Active Session',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  _PulsingIndicator(),
                ],
              ),

              const SizedBox(height: 14),

              Container(
                padding: const EdgeInsets.all(16),
                // Active session card uses a layered box shadow to produce a soft purple glow effect.
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: AppColors.purple.withOpacity(0.4), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.18),
                      blurRadius: 12,
                      spreadRadius: 1,
                    ),
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.08),
                      blurRadius: 24,
                      spreadRadius: 3,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Arkan Mall Parking',
                          style: TextStyle(
                            color: textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'EST. COST',
                              style: TextStyle(
                                color: textSecondary,
                                fontSize: 10,
                                letterSpacing: 0.8,
                              ),
                            ),
                            Text(
                              'EGP 50',
                              style: TextStyle(
                                color: textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          'Level 2 - B4',
                          style: TextStyle(
                              color: textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.purple,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        icon: const Icon(Icons.arrow_forward, size: 14),
                        label: const Text('View Details'),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Activity',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Text(
                    'View all transactions',
                    style: TextStyle(
                      color: AppColors.accentGreen,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              _TransactionRow(
                isDark: isDark,
                initial: 'P',
                initialColor: AppColors.purple,
                name: 'Cairo Airport Terminal 2',
                date: 'Yesterday',
                duration: '4h 20 mins',
                amount: '-EGP 50',
                status: 'PAID',
                statusColor: const Color(0xFF22C55E),
                statusIcon: Icons.check_circle_outline,
                failed: false,
              ),

              const SizedBox(height: 10),

              _TransactionRow(
                isDark: isDark,
                initial: 'X',
                initialColor: const Color(0xFFEF4444),
                name: 'Galleria 40',
                date: 'Dec 25',
                duration: '4h 20 mins',
                amount: '-EGP 50',
                status: 'FAILED',
                statusColor: const Color(0xFFEF4444),
                statusIcon: Icons.cancel_outlined,
                failed: true,
              ),

              const SizedBox(height: 10),

              _TransactionRow(
                isDark: isDark,
                initial: 'P',
                initialColor: AppColors.purple,
                name: 'NGU Parking Lot',
                date: 'Dec 23',
                duration: '4h 20 mins',
                amount: '-EGP 0',
                status: 'PAID',
                statusColor: const Color(0xFF22C55E),
                statusIcon: Icons.check_circle_outline,
                failed: false,
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// Animated green dot with a fading ring — indicates a live parking session.
class _PulsingIndicator extends StatefulWidget {
  @override
  State<_PulsingIndicator> createState() => _PulsingIndicatorState();
}

class _PulsingIndicatorState extends State<_PulsingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    // 1.2s loop with reverse so the ring breathes in and out continuously.
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulse = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 18 * _pulse.value,
                  height: 18 * _pulse.value,
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E)
                        .withOpacity(0.3 * (1 - _pulse.value + 0.5)),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF22C55E),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 6),
            const Text(
              'LIVE',
              style: TextStyle(
                color: Color(0xFF22C55E),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ],
        );
      },
    );
  }
}

// Horizontally scrollable payment card tile showing brand, masked number and expiry.
// The primary card gets a purple border; secondary cards use the default border.
class _PaymentCard extends StatelessWidget {
  final bool isDark;
  final bool isPrimary;
  final String cardType;
  final String? lastFour;
  final String? expiry;

  const _PaymentCard({
    required this.isDark,
    required this.isPrimary,
    required this.cardType,
    this.lastFour,
    this.expiry,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Container(
      width: 220,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPrimary
              ? AppColors.purple.withOpacity(0.5)
              : isDark
              ? AppColors.borderDark
              : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              cardType == 'VISA'
                  ? const Text(
                'VISA',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  fontStyle: FontStyle.italic,
                ),
              )
                  : Row(
                children: [
                  Container(
                    width: 18,
                    height: 18,
                    decoration: const BoxDecoration(
                      color: Color(0xFFEB001B),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(-6, 0),
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color:
                        const Color(0xFFF79E1B).withOpacity(0.85),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
              if (isPrimary)
                Container(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.purple.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                        color: AppColors.purple.withOpacity(0.4)),
                  ),
                  child: const Row(
                    children: [
                      Text(
                        'Primary',
                        style: TextStyle(
                          color: AppColors.purple,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.chevron_right,
                          size: 14, color: AppColors.purple),
                    ],
                  ),
                ),
            ],
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Card Number',
                  style: TextStyle(color: textSecondary, fontSize: 12)),
              Text(
                lastFour != null ? '.... $lastFour' : '—',
                style: TextStyle(
                    color: textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13),
              ),
            ],
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Expiry',
                  style: TextStyle(color: textSecondary, fontSize: 12)),
              Text(
                expiry ?? '—',
                style: TextStyle(
                    color: textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Single row in the recent activity list.
// Failed transactions use a red-tinted background; paid use a purple tint.
class _TransactionRow extends StatelessWidget {
  final bool isDark;
  final String initial;
  final Color initialColor;
  final String name;
  final String date;
  final String duration;
  final String amount;
  final String status;
  final Color statusColor;
  final IconData statusIcon;
  final bool failed;

  const _TransactionRow({
    required this.isDark,
    required this.initial,
    required this.initialColor,
    required this.name,
    required this.date,
    required this.duration,
    required this.amount,
    required this.status,
    required this.statusColor,
    required this.statusIcon,
    required this.failed,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    // Subtle tinted background helps users instantly distinguish paid vs failed.
    final bgColor = failed
        ? const Color(0xFFEF4444).withOpacity(0.05)
        : const Color(0xFF7D39EB).withOpacity(0.05);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: initialColor.withOpacity(0.15),
            child: Text(
              initial,
              style: TextStyle(
                color: initialColor,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    color: textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$date  •  $duration',
                  style: TextStyle(color: textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  color: Color(0xFFB2A8D2),
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Icon(statusIcon, size: 13, color: statusColor),
                  const SizedBox(width: 3),
                  Text(
                    status,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}