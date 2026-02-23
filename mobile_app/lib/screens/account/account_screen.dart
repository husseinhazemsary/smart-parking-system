import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/locale_provider.dart';
import '../account/add_vehicle_screen.dart';
import '../auth/login_screen.dart';
import 'settings_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _notificationsEnabled = true;

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        backgroundColor:
        isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: Stack(
          children: [
            // ── Main scrollable content ──────────────────────────
            SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Purple header ──────────────────────────────────
                  _ProfileHeader(
                    isDark: isDark,
                    onSettings: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => const SettingsScreen()),
                    ),
                  ),

                  // Gap to clear the stats bar overhang
                  const SizedBox(height: _ProfileHeader._statsHeight / 2 + 24),

                  // ── My Vehicles ────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'MY VEHICLES',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _VehicleRow(isDark: isDark),
                              Divider(
                                color: isDark
                                    ? AppColors.borderDark
                                    : AppColors.borderLight,
                                height: 1,
                              ),
                              GestureDetector(
                                onTap: () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                      builder: (_) => const AddVehicleScreen()),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 28,
                                        height: 28,
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                              color: AppColors.accentGreen,
                                              width: 1.5),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.add,
                                            color: AppColors.accentGreen,
                                            size: 18),
                                      ),
                                      const SizedBox(width: 12),
                                      const Text(
                                        'Add Vehicle',
                                        style: TextStyle(
                                          color: AppColors.accentGreen,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Preferences ────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PREFERENCES',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _LanguageRow(isDark: isDark),
                              _RowDivider(isDark: isDark),
                              _PreferenceRow(
                                isDark: isDark,
                                icon: Icons.notifications_outlined,
                                label: 'Notifications',
                                trailing: Switch(
                                  value: _notificationsEnabled,
                                  onChanged: (v) =>
                                      setState(() => _notificationsEnabled = v),
                                  activeColor: Colors.white,
                                  activeTrackColor: AppColors.purple,
                                  inactiveThumbColor: Colors.white,
                                  inactiveTrackColor: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                              ),
                              _RowDivider(isDark: isDark),
                              _PreferenceRow(
                                isDark: isDark,
                                icon: Icons.nightlight_outlined,
                                label: 'Dark Mode',
                                trailing: Switch(
                                  value: themeProvider.isDark,
                                  onChanged: (_) => themeProvider.toggleTheme(),
                                  activeColor: Colors.white,
                                  activeTrackColor: AppColors.purple,
                                  inactiveThumbColor: Colors.white,
                                  inactiveTrackColor: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Support ────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SUPPORT',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.help_outline,
                                  label: 'Help Center',
                                  onTap: () => _launchUrl('https://ezrakna.com/help')),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.chat_bubble_outline,
                                  label: 'Contact Us',
                                  onTap: () => _showContactSheet(context, isDark)),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.star_outline,
                                  label: 'Rate the App',
                                  onTap: () => _rateApp()),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Legal ──────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'LEGAL',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.privacy_tip_outlined,
                                  label: 'Privacy Policy',
                                  onTap: () => _launchUrl('https://ezrakna.com/privacy')),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.description_outlined,
                                  label: 'Terms of Service',
                                  onTap: () => _launchUrl('https://ezrakna.com/terms')),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Log Out ────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: GestureDetector(
                      onTap: () => _confirmLogout(context),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.red.withOpacity(0.2)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.logout, color: Colors.redAccent, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Log Out',
                              style: TextStyle(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'EzRakna v1.0.0',
                      style: TextStyle(color: textSecondary, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),

            // ── NO status bar overlay needed ──────────────────────
          ],
        ),
      ),
    );
  }

  // ── Helper methods ───────────────────────────────────────────────────────

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open $url')),
      );
    }
  }

  Future<void> _rateApp() async {
    // Replace with your actual App Store / Play Store URL
    const storeUrl = 'https://play.google.com/store/apps/details?id=com.ezrakna.app';
    await _launchUrl(storeUrl);
  }

  void _showContactSheet(BuildContext context, bool isDark) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Contact Us',
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 6),
            Text('Reach out to us through any of these channels:',
                style: TextStyle(fontSize: 14, color: subColor)),
            const SizedBox(height: 20),
            _ContactOption(
              isDark: isDark,
              icon: Icons.email_outlined,
              label: 'Email Support',
              subtitle: 'support@ezrakna.com',
              onTap: () => _launchUrl('mailto:support@ezrakna.com'),
            ),
            const SizedBox(height: 12),
            _ContactOption(
              isDark: isDark,
              icon: Icons.phone_outlined,
              label: 'Call Us',
              subtitle: '+20 100 000 0000',
              onTap: () => _launchUrl('tel:+201000000000'),
            ),
            const SizedBox(height: 12),
            _ContactOption(
              isDark: isDark,
              icon: Icons.chat_outlined,
              label: 'WhatsApp',
              subtitle: 'Chat on WhatsApp',
              onTap: () => _launchUrl('https://wa.me/201000000000'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettingsSheet(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Settings',
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 20),
            _SettingsOption(
              isDark: isDark,
              icon: Icons.person_outline,
              label: 'Edit Profile',
              onTap: () {
                Navigator.pop(context);
                // TODO: navigate to edit profile screen
              },
            ),
            const SizedBox(height: 12),
            _SettingsOption(
              isDark: isDark,
              icon: Icons.lock_outline,
              label: 'Change Password',
              onTap: () {
                Navigator.pop(context);
                // TODO: navigate to change password screen
              },
            ),
            const SizedBox(height: 12),
            _SettingsOption(
              isDark: isDark,
              icon: Icons.payment_outlined,
              label: 'Payment Methods',
              onTap: () {
                Navigator.pop(context);
                // TODO: navigate to payment methods screen
              },
            ),
            const SizedBox(height: 12),
            _SettingsOption(
              isDark: isDark,
              icon: Icons.delete_outline,
              label: 'Delete Account',
              labelColor: Colors.redAccent,
              onTap: () {
                Navigator.pop(context);
                _confirmDeleteAccount(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor:
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Log Out',
          style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight),
        ),
        content: Text(
          'Are you sure you want to log out?',
          style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
              );
            },
            child: const Text('Log Out',
                style: TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor:
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Account',
            style: TextStyle(
                color: Colors.redAccent, fontWeight: FontWeight.w700)),
        content: Text(
          'This action is permanent and cannot be undone. All your data will be lost.',
          style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // TODO: call delete account API
            },
            child: const Text('Delete',
                style: TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Contact option widget ─────────────────────────────────────────────────────
class _ContactOption extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  const _ContactOption({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.purple, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight)),
                ],
              ),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// ── Settings option widget ────────────────────────────────────────────────────
class _SettingsOption extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final Color? labelColor;
  final VoidCallback onTap;
  const _SettingsOption({
    required this.isDark,
    required this.icon,
    required this.label,
    this.labelColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = labelColor ??
        (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: textColor, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: textColor)),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final bool isDark;
  final VoidCallback onSettings;
  const _ProfileHeader({required this.isDark, required this.onSettings});

  static const double _statsHeight = 76.0;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Purple section
        Container(
          width: double.infinity,
          padding: EdgeInsets.only(bottom: _statsHeight / 2),
          decoration: const BoxDecoration(
            color: AppColors.purple,
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(32),
              bottomRight: Radius.circular(32),
            ),
          ),
          child: Column(
            children: [
              // Reserve status bar height — the AppBar glassmorphism
              // sits over this area via extendBodyBehindAppBar
              SizedBox(height: topPadding),

              // Top bar row
              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).maybePop(),
                      child: const Icon(Icons.chevron_left,
                          color: Colors.white, size: 28),
                    ),
                    const Text(
                      'Profile',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    GestureDetector(
                      onTap: onSettings,
                      child: const Icon(Icons.settings_outlined,
                          color: Colors.white, size: 24),
                    ),
                  ],
                ),
              ),

              // Avatar
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child:
                    const Icon(Icons.person, size: 48, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: Colors.blue.shade400,
                        shape: BoxShape.circle,
                        border:
                        Border.all(color: AppColors.purple, width: 2),
                      ),
                      child: const Icon(Icons.edit,
                          size: 13, color: Colors.white),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              const Text(
                'Nour Helmy',
                style: TextStyle(
                  color: AppColors.accentGreen,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'nour.helmy@gmail.com',
                style: TextStyle(
                    color: Colors.white.withOpacity(0.85), fontSize: 13),
              ),
              const SizedBox(height: 3),
              Text(
                'MEMBER SINCE JAN 2025',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 11,
                  letterSpacing: 1.0,
                  fontWeight: FontWeight.w500,
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),

        // Stats bar with glassmorphism — sits straddling the curved border.
        // ClipRRect + BackdropFilter blurs the purple behind it.
        Positioned(
          bottom: -(_statsHeight / 2),
          left: 20,
          right: 20,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
              child: Container(
                height: _statsHeight,
                decoration: BoxDecoration(
                  // Dark glass — enough opacity to look dark like image 2
                  // but still lets the blur/tint show subtly through
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.12),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.18),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    _StatItem(value: '42', label: 'Bookings', isDark: isDark),
                    _StatDivider(isDark: isDark),
                    _StatItem(value: 'EGP 350', label: 'Spent', isDark: isDark),
                    _StatDivider(isDark: isDark),
                    _StatItem(value: '128h', label: 'Parked', isDark: isDark),
                  ],
                ),
              ),
            ),
          ),
        ),

        // Invisible spacer so Stack is tall enough for the stats overhang
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: SizedBox(height: _statsHeight / 2),
        ),
      ],
    );
  }
}

// ── Stat widgets ──────────────────────────────────────────────────────────────
class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final bool isDark;
  const _StatItem(
      {required this.value, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  final bool isDark;
  const _StatDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 36,
      color: Colors.white.withOpacity(0.25),
    );
  }
}

// ── Language row ──────────────────────────────────────────────────────────────
class _LanguageRow extends StatelessWidget {
  final bool isDark;
  const _LanguageRow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    // Watch directly so this widget rebuilds on every locale change
    final localeProvider = context.watch<LocaleProvider>();
    final isArabic = localeProvider.isArabic;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(Icons.language, color: textPrimary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Language',
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: textPrimary)),
                const SizedBox(height: 2),
                Text(isArabic ? 'العربية' : 'English',
                    style: TextStyle(fontSize: 12, color: textSecondary)),
              ],
            ),
          ),
          Container(
            height: 32,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.borderDark
                  : const Color(0xFFEEEEF5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: isArabic ? localeProvider.toggleLocale : null,
                  child: _LangOption(label: 'EN', isActive: !isArabic, isDark: isDark),
                ),
                GestureDetector(
                  onTap: isArabic ? null : localeProvider.toggleLocale,
                  child: _LangOption(label: 'AR', isActive: isArabic, isDark: isDark),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LangOption extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  const _LangOption(
      {required this.label, required this.isActive, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 40,
      height: 32,
      decoration: BoxDecoration(
        color: isActive ? AppColors.purple : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          color: isActive
              ? Colors.white
              : isDark
              ? AppColors.textSecondaryDark
              : AppColors.textSecondaryLight,
          fontSize: 13,
          fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
    );
  }
}

// ── Vehicle row ───────────────────────────────────────────────────────────────
class _VehicleRow extends StatelessWidget {
  final bool isDark;
  const _VehicleRow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.directions_car_outlined,
                color: AppColors.purple, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Toyota Corolla',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight)),
                const SizedBox(height: 2),
                Text('BG 4567',
                    style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight)),
              ],
            ),
          ),
          Icon(Icons.chevron_right,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight),
        ],
      ),
    );
  }
}

// ── Section card ──────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final bool isDark;
  final Widget child;
  const _SectionCard({required this.isDark, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: child,
    );
  }
}

// ── Preference row ────────────────────────────────────────────────────────────
class _PreferenceRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final Widget trailing;
  final VoidCallback? onTap;

  const _PreferenceRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight)),
            ),
            trailing,
          ],
        ),
      ),
    );
  }
}

// ── Nav row ───────────────────────────────────────────────────────────────────
class _NavRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _NavRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight)),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// ── Row divider ───────────────────────────────────────────────────────────────
class _RowDivider extends StatelessWidget {
  final bool isDark;
  const _RowDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      indent: 50,
      color: isDark ? AppColors.borderDark : AppColors.borderLight,
    );
  }
}