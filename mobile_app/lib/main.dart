import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/user_prefs_provider.dart';
import 'providers/user_provider.dart';
import 'providers/saved_place_provider.dart';
import 'providers/vehicle_provider.dart';
import 'providers/parking_provider.dart';
import 'theme/app_theme.dart';
import 'screens/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize providers before runApp so initial state is ready synchronously.
  final authProvider = AuthProvider();
  final themeProvider = ThemeProvider();
  final localeProvider = LocaleProvider();
  await Future.wait([
    authProvider.init(),
    themeProvider.init(),
    localeProvider.init(),
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: themeProvider),
        ChangeNotifierProvider.value(value: localeProvider),
        ChangeNotifierProvider(create: (_) => UserPrefsProvider()),
        ChangeNotifierProxyProvider<AuthProvider, UserProvider>(
          create: (_) => UserProvider(),
          update: (_, auth, user) => user!..onAuthChanged(auth.isAuthenticated),
        ),
        ChangeNotifierProxyProvider<AuthProvider, VehicleProvider>(
          create: (_) => VehicleProvider(),
          update: (_, auth, vehicles) =>
              vehicles!..onAuthChanged(auth.isAuthenticated),
        ),
        ChangeNotifierProxyProvider<AuthProvider, SavedPlaceProvider>(
          create: (_) => SavedPlaceProvider(),
          update: (_, auth, saved) =>
              saved!..onAuthChanged(auth.isAuthenticated),
        ),
        ChangeNotifierProvider(create: (_) => ParkingProvider()),
      ],
      child: const EzRaknaApp(),
    ),
  );
}

class EzRaknaApp extends StatelessWidget {
  const EzRaknaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();

    return MaterialApp(
      title: 'EzRakna',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeProvider.themeMode,
      locale: localeProvider.locale,
      supportedLocales: const [
        Locale('en'),
        Locale('ar'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const SplashScreen(),
    );
  }
}
