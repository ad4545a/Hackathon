import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';

class ApiConfig {
  // Default to emulator IP, will be updated in init()
  static String baseUrl = 'http://10.0.2.2:8000';
  
  // Real device IP (Your Laptop's IP)
  static const String _laptopIp = '172.16.88.68'; // TODO: Update if IP changes

  // Endpoints
  static const String schemesEndpoint = '/schemes';
  static const String eligibleEndpoint = '/schemes/eligible';

  static Future<void> initialize() async {
    if (kIsWeb) return; // Use localhost or hosted URL for web

    final deviceInfo = DeviceInfoPlugin();
    bool isRealDevice = false;

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      isRealDevice = androidInfo.isPhysicalDevice;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      isRealDevice = iosInfo.isPhysicalDevice;
    }

    if (isRealDevice) {
      baseUrl = 'http://$_laptopIp:8000';
      debugPrint('🚀 Running on Real Device. Text Base URL: $baseUrl');
    } else {
      baseUrl = 'http://10.0.2.2:8000';
      debugPrint('💻 Running on Emulator. Base URL: $baseUrl');
    }
  }
}
