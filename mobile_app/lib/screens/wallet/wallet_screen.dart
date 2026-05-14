// Wallet screen — shows saved payment cards, the active parking session
// and recent transaction history.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../l10n/app_localizations.dart';
import 'add_card_screen.dart';
import '../account/settings_screen.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  // Opens the full transactions list bottom sheet.
  void _showAllTransactionsSheet(BuildContext context, bool isDark, AppLocalizations l10n) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    const transactions = [
      ('P', Color(0xFF7D39EB), 'Cairo Airport Terminal 2', 'Yesterday', '4h 20m', '-EGP 50', 'PAID', Color(0xFF22C55E), false),
      ('X', Color(0xFFEF4444), 'Galleria 40', 'Dec 25', '4h 20m', '-EGP 50', 'FAILED', Color(0xFFEF4444), true),
      ('P', Color(0xFF7D39EB), 'NGU Parking Lot', 'Dec 23', '4h 20m', '-EGP 0', 'PAID', Color(0xFF22C55E), false),
      ('P', Color(0xFF7D39EB), 'Arkan Mall Parking', 'Dec 18', '2h 15m', '-EGP 65', 'PAID', Color(0xFF22C55E), false),
      ('P', Color(0xFF3B82F6), 'Cairo Festival City', 'Dec 15', '3h 45m', '-EGP 90', 'PAID', Color(0xFF22C55E), false),
      ('X', Color(0xFFEF4444), 'Smart Village Hub', 'Dec 10', '8h 00m', '-EGP 160', 'FAILED', Color(0xFFEF4444), true),
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: EdgeInsets.only(bottom: bottomPadding),
              child: Column(
                children: [
                  // Drag handle
                  Padding(
                    padding: const EdgeInsets.only(top: 16, bottom: 12),
                    child: Center(
                      child: Container(
                        width: 40, height: 4,
                        decoration: BoxDecoration(color: divColor, borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.purple.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.receipt_long_outlined, color: AppColors.purple, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Text(l10n.allTransactions,
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      itemCount: transactions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final t = transactions[i];
                        final bgTint = t.$9
                            ? const Color(0xFFEF4444).withOpacity(0.05)
                            : const Color(0xFF7D39EB).withOpacity(0.05);
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: bgTint,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: t.$2.withOpacity(0.15),
                                child: Text(t.$1,
                                    style: TextStyle(color: t.$2, fontWeight: FontWeight.w700, fontSize: 16)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(t.$3,
                                        style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text('${t.$4}  •  ${t.$5}',
                                        style: TextStyle(color: subColor, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(t.$6,
                                      style: const TextStyle(
                                          color: Color(0xFFB2A8D2),
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14)),
                                  const SizedBox(height: 2),
                                  Text(t.$7,
                                      style: TextStyle(color: t.$8, fontSize: 12, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Opens the active session detail bottom sheet — mirrors the one on the home screen.
  void _showActiveSessionSheet(BuildContext context, bool isDark, AppLocalizations l10n) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: divColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.purple.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.local_parking, color: AppColors.purple, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Arkan Mall Parking',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
                      const SizedBox(height: 2),
                      Text('Sheikh Zayed, Giza',
                          style: TextStyle(fontSize: 12, color: subColor)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.purple.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l10n.elapsedTime, style: TextStyle(fontSize: 11, color: subColor)),
                        const SizedBox(height: 2),
                        const Text('01:23:45',
                            style: TextStyle(color: AppColors.purple, fontSize: 26, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(l10n.startedAt, style: TextStyle(fontSize: 11, color: subColor)),
                        const SizedBox(height: 2),
                        Text('09:30 PM',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textColor)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _WalletDetailRow(label: l10n.slot, value: 'B4', icon: Icons.local_parking, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _WalletDetailRow(label: l10n.levelAndGate, value: 'Level 2  •  Gate B', icon: Icons.layers_outlined, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              _WalletDetailRow(label: l10n.vehicleLabel, value: 'Toyota Corolla  •  BG 4567', icon: Icons.directions_car_outlined, textColor: textColor, subColor: subColor),
              Divider(height: 24, color: divColor),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.estCost, style: TextStyle(fontSize: 13, color: subColor)),
                  const Text('EGP 50.00',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF22C55E))),
                ],
              ),
              const SizedBox(height: 28),
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.stop_circle_outlined, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 8),
                      Text(l10n.endSession,
                          style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w600, fontSize: 15)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final l10n = AppLocalizations.of(context)!;

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
                  children: [
                    Expanded(
                      child: Text(
                        l10n.wallet,
                        style: TextStyle(
                          color: textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
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
                    l10n.paymentMethods,
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
                    child: Text(
                      l10n.addNewCard,
                      style: TextStyle(
                        color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
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
                            color: (isDark ? AppColors.accentGreen : const Color(0xFF16A34A)).withOpacity(0.4),
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add, color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A), size: 26),
                              const SizedBox(height: 6),
                              Text(
                                l10n.addCard,
                                style: TextStyle(
                                  color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
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
                    l10n.activeSession,
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
                // Reduced glow — single subtle shadow.
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: AppColors.purple.withOpacity(0.3), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.08),
                      blurRadius: 14,
                      spreadRadius: 1,
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
                              l10n.estCost,
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
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        GestureDetector(
                          onTap: () => _showActiveSessionSheet(context, isDark, l10n),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                l10n.viewDetails,
                                style: TextStyle(
                                  color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Icon(
                                Icons.arrow_forward,
                                color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                                size: 12,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.recentActivity,
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _showAllTransactionsSheet(context, isDark, l10n),
                    child: Text(
                      l10n.viewAllTransactions,
                      style: TextStyle(
                        color: isDark ? AppColors.accentGreen : const Color(0xFF16A34A),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
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
                  child: Row(
                    children: [
                      Text(
                        AppLocalizations.of(context)!.primary,
                        style: const TextStyle(
                          color: AppColors.purple,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(Icons.chevron_right,
                          size: 14, color: AppColors.purple),
                    ],
                  ),
                ),
            ],
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(AppLocalizations.of(context)!.cardNumberLabel,
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
              Text(AppLocalizations.of(context)!.expiry,
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
// Label/value detail row used inside the active session sheet in WalletScreen.
class _WalletDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color textColor;
  final Color subColor;
  const _WalletDetailRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.textColor,
    required this.subColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFFB2A8D2)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label, style: TextStyle(fontSize: 13, color: subColor)),
        ),
        Text(value,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: textColor)),
      ],
    );
  }
}