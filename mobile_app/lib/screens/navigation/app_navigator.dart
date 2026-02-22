import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import '../../theme/app_colors.dart';
import '../home/home_screen.dart';
import '../history/history_screen.dart';
import '../wallet/wallet_screen.dart';
import '../account/account_screen.dart';

class AppNavigator extends StatefulWidget {
  final int initialIndex;
  const AppNavigator({super.key, this.initialIndex = 0});

  @override
  State<AppNavigator> createState() => _AppNavigatorState();
}

class _AppNavigatorState extends State<AppNavigator> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  final List<Widget> _screens = const [
    HomeScreen(),
    HistoryScreen(),
    WalletScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness:
      isDark ? Brightness.light : Brightness.dark,
    ));

    return Scaffold(
      backgroundColor:
      isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      // Directionality.ltr locks the nav bar layout regardless of app locale.
      // Icons stay in the same order, labels still render in Arabic if needed.
      bottomNavigationBar: Directionality(
        textDirection: TextDirection.ltr,
        child: _BottomNavBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
        ),
      ),
    );
  }
}

class _BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _BottomNavBar({
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final items = [
      _NavItem(
          icon: Icons.home_outlined,
          activeIcon: Icons.home,
          label: 'Home'),
      _NavItem(
          icon: Icons.history_outlined,
          activeIcon: Icons.history,
          label: 'History'),
      _NavItem(
          icon: Icons.account_balance_wallet_outlined,
          activeIcon: Icons.account_balance_wallet,
          label: 'Wallet'),
      _NavItem(
          icon: Icons.person_outline,
          activeIcon: Icons.person,
          label: 'Account'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A0A1A) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
            width: 0.5,
          ),
        ),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (index) {
              final item = items[index];
              final isActive = currentIndex == index;
              return GestureDetector(
                onTap: () => onTap(index),
                behavior: HitTestBehavior.opaque,
                child: SizedBox(
                  width: 72,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isActive ? item.activeIcon : item.icon,
                        color: isActive
                            ? AppColors.accentGreen
                            : isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isActive
                              ? FontWeight.w600
                              : FontWeight.w400,
                          color: isActive
                              ? AppColors.accentGreen
                              : isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}