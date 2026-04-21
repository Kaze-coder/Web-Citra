/**
 * Geocoding Service
 * Service untuk convert alamat ke koordinat LAT/LNG
 * Menggunakan Nominatim API (gratis, no key required)
 */

const axios = require('axios');
require('dotenv').config();

class GeocodingService {
  constructor() {
    // Nominatim API (OpenStreetMap) - free, no API key needed
    this.apiUrl = 'https://nominatim.openstreetmap.org/search';
    this.reverseApiUrl = 'https://nominatim.openstreetmap.org/reverse';
  }

  /**
   * Geocode alamat ke latitude & longitude
   * @param {string} address - Alamat yang akan di-geocode
   * @returns {object} - Hasil geocoding {success, latitude, longitude, formatted_address}
   */
  async geocodeAddress(address) {
    try {
      if (!address || address.trim() === '') {
        return {
          success: false,
          error: 'Alamat tidak boleh kosong'
        };
      }

      // Extract komponens alamat
      const kampung = this.extractKampung(address);
      const city = this.extractCity(address);
      const province = this.extractProvince(address);

      // Build smarter variations: try specific locations first, then progressively broader
      const addressVariations = [
        // Variation 1: Full address with Indonesia
        `${address}, Indonesia`,
        // Variation 2: Try as-is
        address,
        // Variation 3: Kampung + City + Province (MOST SPECIFIC - street/village level)
        kampung && city && province ? `${kampung}, ${city}, ${province}, Indonesia` : null,
        // Variation 4: Kampung + City + Province (without Indonesia)
        kampung && city && province ? `${kampung}, ${city}, ${province}` : null,
        // Variation 5: Kampung + City + Indonesia
        kampung && city ? `${kampung}, ${city}, Indonesia` : null,
        // Variation 6: Kampung + City (no province)
        kampung && city ? `${kampung}, ${city}` : null,
        // Variation 7: City + Province + Indonesia
        city && province ? `${city}, ${province}, Indonesia` : null,
        // Variation 8: City + Province
        city && province ? `${city}, ${province}` : null,
        // Variation 9: City + Indonesia
        city ? `${city}, Indonesia` : null,
        // Variation 10: City alone
        city,
        // Variation 11: Province + Indonesia
        province ? `${province}, Indonesia` : null,
        // Variation 12: Province alone
        province
      ];

      // Filter out empty/duplicate strings
      const uniqueAddresses = [...new Set(addressVariations.filter(a => a && a.trim() !== ''))];

      console.log(`🔍 Geocoding attempts for: "${address}"`);
      console.log(`   Extracted - Kampung: "${kampung}" | City: "${city}" | Province: "${province}"`);
      console.log(`   Trying (${uniqueAddresses.length} variations)...`);

      // Try each variation
      for (const searchAddress of uniqueAddresses) {
        try {
          const response = await axios.get(this.apiUrl, {
            params: {
              q: searchAddress,
              format: 'json',
              limit: 1,
              language: 'id'
            },
            headers: {
              'User-Agent': 'ISP-Management-System/1.0'
            }
          });

          const results = response.data;

          if (results && results.length > 0) {
            const location = results[0];
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lon);
            const formattedAddress = location.display_name;

            console.log(`✓ Geocoding success with: "${searchAddress}"`);
            console.log(`  → Coordinates: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);

            return {
              success: true,
              latitude,
              longitude,
              formatted_address: formattedAddress,
              place_id: location.place_id
            };
          }
        } catch (innerError) {
          // Continue to next variation  
          continue;
        }
      }

      // All variations failed
      return {
        success: false,
        error: 'Alamat tidak ditemukan. Coba dengan format: "Nama Kota, Provinsi" (contoh: "Bandung, Jawa Barat")'
      };
    } catch (error) {
      console.error('Geocoding Error:', error.message);
      return {
        success: false,
        error: error.message || 'Gagal melakukan geocoding'
      };
    }
  }

  /**
   * Extract kampung/village name dari alamat
   * Cari: "Kp. Parung Tanjung", "Desa X", "Kelurahan Y"
   */
  extractKampung(address) {
    // Cari pattern "Kp. NAMA_KAMPUNG"
    const kpMatch = address.match(/Kp\.\s+([^,]+)/i);
    if (kpMatch && kpMatch[1]) {
      return kpMatch[1].trim();
    }

    // Cari pattern "Desa NAMA" atau "Kelurahan NAMA"
    const desaMatch = address.match(/(Desa|Kelurahan)\s+([^,]+)/i);
    if (desaMatch && desaMatch[2]) {
      return desaMatch[2].trim();
    }

    return '';
  }

  /**
   * Extract city dari alamat dengan smart parsing untuk Indonesia
   * Priority: Kecamatan → Kabupaten → meaningful name
   */
  extractCity(address) {
    const originalParts = address.split(',').map(p => p.trim());
    
    // Filter bagian yang tidak perlu
    const filtered = originalParts.filter(part => {
      if (!part) return false;
      const upper = part.toUpperCase();
      if (upper === 'ID' || upper === 'INDONESIA') return false;
      if (/^\d{5,6}$/.test(part)) return false;
      if (part.length < 2) return false;
      if (part.includes('Jl.') || part.includes('No.') || part.includes('RT.') || 
          part.includes('RW.') || part.includes('Kp.')) return false;
      return true;
    });

    if (filtered.length === 0) return '';

    // Priority 1: Cari kecamatan
    for (const part of filtered) {
      if (part.includes('Kec.')) {
        return part.replace('Kec.', '').trim();
      }
    }

    // Priority 2: Exclude provinsi dan ambil nama city yang meaningful
    const provinceKeywords = ['JAWA', 'SUMATERA', 'SULAWESI', 'KALIMANTAN', 'BARAT', 
                              'TIMUR', 'TENGAH', 'TENGGARA', 'BALI', 'MALUKU', 'PAPUA', 
                              'RIAU', 'JAMBI', 'BENGKULU', 'LAMPUNG', 'YOGYAKARTA'];
    
    for (let i = filtered.length - 1; i >= 0; i--) {
      const part = filtered[i];
      const upper = part.toUpperCase();
      
      if (upper.includes('KAB.') || upper.includes('KOTA')) continue;
      if (provinceKeywords.some(kw => upper.includes(kw))) continue;
      
      if (part.length > 2) {
        return part;
      }
    }

    return '';
  }

  /**
   * Extract province dari alamat
   */
  extractProvince(address) {
    const addressUpper = address.toUpperCase();
    
    const provinces = [
      'JAWA BARAT', 'JAWA TIMUR', 'JAWA TENGAH',
      'SUMATERA UTARA', 'SUMATERA BARAT', 'RIAU', 'JAMBI', 'SUMATERA SELATAN',
      'KALIMANTAN UTARA', 'KALIMANTAN BARAT', 'KALIMANTAN TENGAH', 'KALIMANTAN SELATAN', 'KALIMANTAN TIMUR',
      'SULAWESI UTARA', 'SULAWESI TENGAH', 'SULAWESI SELATAN', 'SULAWESI TENGGARA',
      'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR',
      'MALUKU', 'MALUKU UTARA', 'PAPUA', 'PAPUA BARAT',
      'BALI', 'YOGYAKARTA', 'JAKARTA', 'BENGKULU', 'LAMPUNG'
    ];

    // Find full province name
    for (const province of provinces) {
      if (addressUpper.includes(province)) {
        return province.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      }
    }

    // Fallback: look for JAWA variations
    if (addressUpper.includes('JAWA')) {
      if (addressUpper.includes('BARAT')) return 'Jawa Barat';
      if (addressUpper.includes('TIMUR')) return 'Jawa Timur';
      if (addressUpper.includes('TENGAH')) return 'Jawa Tengah';
    }

    return '';
  }

  /**
   * Reverse geocode dari LAT/LNG ke alamat
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {object} - Hasil reverse geocoding
   */
  async reverseGeocode(latitude, longitude) {
    try {
      if (!latitude || !longitude) {
        return {
          success: false,
          error: 'Latitude dan longitude harus diisi'
        };
      }

      const response = await axios.get(this.reverseApiUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          language: 'id'
        },
        headers: {
          'User-Agent': 'ISP-Management-System/1.0'
        }
      });

      const result = response.data;
      const formattedAddress = result.address ? result.display_name : '';

      if (!formattedAddress) {
        return {
          success: false,
          error: 'Alamat tidak ditemukan untuk koordinat tersebut'
        };
      }

      return {
        success: true,
        address: formattedAddress
      };
    } catch (error) {
      console.error('Reverse Geocoding Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeocodingService();
