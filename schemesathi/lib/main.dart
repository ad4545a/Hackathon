import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:schemesathi/l10n/generated/app_localizations.dart';

import 'theme/app_theme.dart';
import 'providers/locale_provider.dart';
import 'screens/splash_screen.dart';

import 'services/api_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Using ChangeNotifierProvider to inject LocaleProvider
    return ChangeNotifierProvider(
      create: (_) => LocaleProvider(),
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, child) {
          return MaterialApp(
            title: 'SchemeSathi AI',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            
            // Localization Configuration
            locale: localeProvider.locale,
            supportedLocales: const [
              Locale('en'), // English
              Locale('hi'), // Hindi
              Locale('bn'), // Bengali
              Locale('ta'), // Tamil
              Locale('te'), // Telugu
              Locale('mr'), // Marathi
              Locale('gu'), // Gujarati
              Locale('kn'), // Kannada
              Locale('ml'), // Malayalam
              Locale('pa'), // Punjabi
            ],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
