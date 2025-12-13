// WebHID API type definitions
// These are built into modern browsers but TypeScript doesn't include them by default

interface HIDDevice extends EventTarget {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: readonly HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
}

interface HIDCollectionInfo {
  readonly usagePage: number;
  readonly usage: number;
  readonly type: number;
  readonly children: readonly HIDCollectionInfo[];
  readonly inputReports: readonly HIDReportInfo[];
  readonly outputReports: readonly HIDReportInfo[];
  readonly featureReports: readonly HIDReportInfo[];
}

interface HIDReportInfo {
  readonly reportId: number;
  readonly items: readonly HIDReportItem[];
}

interface HIDReportItem {
  readonly isAbsolute: boolean;
  readonly isArray: boolean;
  readonly isBufferedBytes: boolean;
  readonly isConstant: boolean;
  readonly isLinear: boolean;
  readonly isRange: boolean;
  readonly isVolatile: boolean;
  readonly hasNull: boolean;
  readonly hasPreferredState: boolean;
  readonly wrap: boolean;
  readonly usages: readonly number[];
  readonly usageMinimum: number;
  readonly usageMaximum: number;
  readonly reportSize: number;
  readonly reportCount: number;
  readonly unitExponent: number;
  readonly unitSystem: string;
  readonly unitFactorLengthExponent: number;
  readonly unitFactorMassExponent: number;
  readonly unitFactorTimeExponent: number;
  readonly unitFactorTemperatureExponent: number;
  readonly unitFactorCurrentExponent: number;
  readonly unitFactorLuminousIntensityExponent: number;
  readonly logicalMinimum: number;
  readonly logicalMaximum: number;
  readonly physicalMinimum: number;
  readonly physicalMaximum: number;
  readonly strings: readonly string[];
}

interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly data: DataView;
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
}

interface Navigator {
  readonly hid: HID;
}
