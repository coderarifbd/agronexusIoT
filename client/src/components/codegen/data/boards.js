// Hardware Board Definitions for AgroNexus IoT Code Generator

export const BOARDS = {
  esp32: {
    id: "esp32",
    name: "ESP32 Dev Module (WROOM-32)",
    shortName: "ESP32",
    category: "Wi-Fi + BLE Microcontroller",
    architecture: "xtensa-esp32",
    platform: "arduino",
    language: "cpp",
    fileExtension: "ino",
    voltage: "3.3V",
    hasWifi: true,
    hasEthernet: false,
    adcResolution: 12, // 0 - 4095
    defaultServerHost: "192.168.1.9:5050",
    digitalPins: [
      { pin: 4, label: "GPIO 4 (D4)", recommended: true },
      { pin: 5, label: "GPIO 5 (D5)", recommended: true },
      { pin: 12, label: "GPIO 12 (D12)" },
      { pin: 13, label: "GPIO 13 (D13)" },
      { pin: 14, label: "GPIO 14 (D14)" },
      { pin: 15, label: "GPIO 15 (D15)" },
      { pin: 16, label: "GPIO 16 (RX2)" },
      { pin: 17, label: "GPIO 17 (TX2)" },
      { pin: 18, label: "GPIO 18 (SCK)" },
      { pin: 19, label: "GPIO 19 (MISO)" },
      { pin: 21, label: "GPIO 21 (SDA)", isI2C: "sda" },
      { pin: 22, label: "GPIO 22 (SCL)", isI2C: "scl" },
      { pin: 23, label: "GPIO 23 (MOSI)" },
      { pin: 25, label: "GPIO 25 (DAC1)" },
      { pin: 26, label: "GPIO 26 (DAC2)" },
      { pin: 27, label: "GPIO 27 (D27)" },
      { pin: 32, label: "GPIO 32 (ADC1_CH4)", isAdc: true },
      { pin: 33, label: "GPIO 33 (ADC1_CH5)", isAdc: true }
    ],
    adcPins: [
      { pin: 34, label: "GPIO 34 (ADC1 - Recommended)", recommended: true },
      { pin: 35, label: "GPIO 35 (ADC1)", recommended: true },
      { pin: 32, label: "GPIO 32 (ADC1)" },
      { pin: 33, label: "GPIO 33 (ADC1)" },
      { pin: 36, label: "GPIO 36 (VP / ADC1)" },
      { pin: 39, label: "GPIO 39 (VN / ADC1)" }
    ],
    i2c: { sda: 21, scl: 22, label: "I2C Bus: SDA=21, SCL=22" },
    spi: { mosi: 23, miso: 19, sck: 18, cs: 5 },
    uart: { rx: 16, tx: 17, label: "UART2: RX=16, TX=17" },
    notes: [
      "Use ADC1 pins (GPIO 32-39) for analog sensors because ADC2 is shared with WiFi.",
      "Logic voltage is strictly 3.3V. Never supply 5V directly to GPIO inputs.",
      "Recommended baud rate: 115200."
    ]
  },

  esp8266: {
    id: "esp8266",
    name: "ESP8266 (NodeMCU / Wemos D1 Mini)",
    shortName: "ESP8266",
    category: "Wi-Fi Microcontroller",
    architecture: "esp8266",
    platform: "arduino",
    language: "cpp",
    fileExtension: "ino",
    voltage: "3.3V",
    hasWifi: true,
    hasEthernet: false,
    adcResolution: 10, // 0 - 1023
    defaultServerHost: "192.168.1.9:5050",
    digitalPins: [
      { pin: "D1", label: "D1 (GPIO 5 / SCL)", isI2C: "scl" },
      { pin: "D2", label: "D2 (GPIO 4 / SDA)", isI2C: "sda" },
      { pin: "D3", label: "D3 (GPIO 0 - Flash pull-up)" },
      { pin: "D4", label: "D4 (GPIO 2 - Onboard LED)", recommended: true },
      { pin: "D5", label: "D5 (GPIO 14 / SCK)", recommended: true },
      { pin: "D6", label: "D6 (GPIO 12 / MISO)", recommended: true },
      { pin: "D7", label: "D7 (GPIO 13 / MOSI)", recommended: true },
      { pin: "D8", label: "D8 (GPIO 15 / Boot pulldown)" }
    ],
    adcPins: [
      { pin: "A0", label: "A0 (ADC0 - 0 to 1.0V/3.3V)", recommended: true }
    ],
    i2c: { sda: "D2", scl: "D1", label: "I2C Bus: SDA=D2 (GPIO 4), SCL=D1 (GPIO 5)" },
    spi: { mosi: "D7", miso: "D6", sck: "D5", cs: "D8" },
    notes: [
      "ESP8266 has only ONE analog pin (A0).",
      "Avoid pulling D3/D4/D8 low during power-on boot sequence.",
      "Recommended baud rate: 115200."
    ]
  },

  arduino_uno: {
    id: "arduino_uno",
    name: "Arduino Uno R3",
    shortName: "Arduino Uno",
    category: "8-bit AVR Microcontroller",
    architecture: "avr",
    platform: "arduino",
    language: "cpp",
    fileExtension: "ino",
    voltage: "5V",
    hasWifi: false,
    hasEthernet: true, // W5100 / W5500 Ethernet shield
    adcResolution: 10, // 0 - 1023
    defaultServerHost: "192.168.1.9:5050",
    digitalPins: [
      { pin: 2, label: "Digital Pin 2 (Interrupt)", recommended: true },
      { pin: 3, label: "Digital Pin 3 (PWM / Interrupt)", recommended: true },
      { pin: 4, label: "Digital Pin 4", recommended: true },
      { pin: 5, label: "Digital Pin 5 (PWM)", recommended: true },
      { pin: 6, label: "Digital Pin 6 (PWM)", recommended: true },
      { pin: 7, label: "Digital Pin 7", recommended: true },
      { pin: 8, label: "Digital Pin 8" },
      { pin: 9, label: "Digital Pin 9 (PWM)" }
    ],
    adcPins: [
      { pin: "A0", label: "Analog Pin A0", recommended: true },
      { pin: "A1", label: "Analog Pin A1", recommended: true },
      { pin: "A2", label: "Analog Pin A2" },
      { pin: "A3", label: "Analog Pin A3" }
    ],
    i2c: { sda: "A4", scl: "A5", label: "I2C Bus: SDA=A4, SCL=A5" },
    spi: { mosi: 11, miso: 12, sck: 13, cs: 10 },
    notes: [
      "Operating voltage is 5V.",
      "Pin 10, 11, 12, 13 are reserved when using standard Ethernet Shield (W5100/W5500).",
      "Recommended baud rate: 9600."
    ]
  },

  arduino_nano: {
    id: "arduino_nano",
    name: "Arduino Nano",
    shortName: "Arduino Nano",
    category: "Compact 8-bit AVR Microcontroller",
    architecture: "avr",
    platform: "arduino",
    language: "cpp",
    fileExtension: "ino",
    voltage: "5V",
    hasWifi: false,
    hasEthernet: false,
    adcResolution: 10, // 0 - 1023
    defaultServerHost: "192.168.1.9:5050",
    digitalPins: [
      { pin: 2, label: "D2", recommended: true },
      { pin: 3, label: "D3 (PWM)", recommended: true },
      { pin: 4, label: "D4", recommended: true },
      { pin: 5, label: "D5 (PWM)", recommended: true },
      { pin: 6, label: "D6 (PWM)", recommended: true },
      { pin: 7, label: "D7", recommended: true },
      { pin: 8, label: "D8", recommended: true },
      { pin: 9, label: "D9 (PWM)" }
    ],
    adcPins: [
      { pin: "A0", label: "A0", recommended: true },
      { pin: "A1", label: "A1", recommended: true },
      { pin: "A2", label: "A2" },
      { pin: "A3", label: "A3" },
      { pin: "A6", label: "A6 (Analog only)" },
      { pin: "A7", label: "A7 (Analog only)" }
    ],
    i2c: { sda: "A4", scl: "A5", label: "I2C Bus: SDA=A4, SCL=A5" },
    notes: [
      "Operating voltage is 5V.",
      "Features two extra analog inputs (A6, A7) compared to Uno.",
      "Requires external communication module for remote Internet posting."
    ]
  },

  raspberry_pi: {
    id: "raspberry_pi",
    name: "Raspberry Pi (3 / 4 / 5 / Zero 2 W)",
    shortName: "Raspberry Pi",
    category: "Linux Single Board Computer (SBC)",
    architecture: "arm-linux",
    platform: "python",
    language: "python",
    fileExtension: "py",
    voltage: "3.3V",
    hasWifi: true,
    hasEthernet: true,
    defaultServerHost: "192.168.1.9:5050",
    digitalPins: [
      { pin: 4, label: "GPIO 4 (Pin 7 - 1-Wire)", recommended: true },
      { pin: 17, label: "GPIO 17 (Pin 11)", recommended: true },
      { pin: 27, label: "GPIO 27 (Pin 13)", recommended: true },
      { pin: 22, label: "GPIO 22 (Pin 15)", recommended: true },
      { pin: 23, label: "GPIO 23 (Pin 16)", recommended: true },
      { pin: 24, label: "GPIO 24 (Pin 18)", recommended: true },
      { pin: 25, label: "GPIO 25 (Pin 22)" },
      { pin: 5, label: "GPIO 5 (Pin 29)" },
      { pin: 6, label: "GPIO 6 (Pin 31)" }
    ],
    adcPins: [], // No native analog ADC
    i2c: { sda: 2, scl: 3, label: "I2C-1: SDA=GPIO 2 (Pin 3), SCL=GPIO 3 (Pin 5)" },
    notes: [
      "Raspberry Pi GPIOs are strictly 3.3V tolerant. 5V will permanently damage the SoC.",
      "Does not have built-in analog inputs (requires external I2C ADC like ADS1115 for analog sensors).",
      "Executes natively in Python 3 with pip packages."
    ]
  }
};
