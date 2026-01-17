import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';

class ApiConfig {
  // VPS Endpoint
  static String baseUrl = 'http://117.252.16.130:8001';
  
  // Real device IP (Your Laptop's IP)
  static const String _laptopIp = '172.16.88.68'; // TODO: Update if IP changes

  // Endpoints
  static const String schemesEndpoint = '/schemes';
  static const String eligibleEndpoint = '/schemes/eligible';

  static Future<void> initialize() async {
    // Updated to VPS IP
    baseUrl = 'http://117.252.16.130:8001';
    debugPrint('🚀 Forced Base URL: $baseUrl');
  }
}
