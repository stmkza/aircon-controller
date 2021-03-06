export enum ElProtocol {
    ECHONET_LITE
}

export enum ElFrameFormat {
    SPECIFIED_MESSAGE_FORMAT,
    ARBITRARY_MESSAGE_FORMAT
}

export class ElHeader1 {
    private _value: number[];
    constructor(protocol: ElProtocol) {
        switch (protocol) {
            case ElProtocol.ECHONET_LITE:
                this._value = [0b00010000];
                break;
            default:
                throw new RangeError('Unsupported Protocol');
        }
    }

    byteLength = 1;

    get byteArray(): Uint8Array {
        const data = new Uint8Array(this.byteLength);
        data.set(this._value);

        return data;
    }

    toString(): string {
        return this._value[0].toString(16).padStart(2, '0');
    }
}

export class ElHeader2 {
    private _value: number[];
    constructor(format: ElFrameFormat) {
        switch (format) {
            case ElFrameFormat.SPECIFIED_MESSAGE_FORMAT:
                this._value = [0x81];
                break;
            case ElFrameFormat.ARBITRARY_MESSAGE_FORMAT:
                this._value = [0x82];
                break;
            default:
                throw new RangeError('Unsupported Frame Format');
        }
    }

    byteLength = 1;

    get byteArray(): Uint8Array {
        const data = new Uint8Array(this.byteLength);
        data.set(this._value);

        return data;
    }

    toString(): string {
        return this._value[0].toString(16).padStart(2, '0');
    }
}

export class ElTransactionId {
    private _value: number[];
    constructor(value: number) {
        if (0 > value || value > 0xFFFF) {
            throw new RangeError('Invalid Transaction Id')
        }

        this._value = [
            (value >> 8) & 0xFF,
            value & 0xFF
        ]
    }

    byteLength = 2;

    get byteArray(): Uint8Array {
        const data = new Uint8Array(this.byteLength);
        data.set(this._value);

        return data;
    }

    get value(): number {
        return (this._value[0] << 8) + this._value[1];
    }

    toString(): string {
        return this.value.toString(10);
    }
}

export class ElObject {
    private _classGroupCode: number[];
    private _classCode: number[];
    private _instanceCode: number[];
    constructor(classGroupCode: number, classCode: number, instanceCode: number) {
        if (0 > classGroupCode || classGroupCode > 0xFF) {
            throw new RangeError('Invalid ClassGroupCode');
        }
        this._classGroupCode = [classGroupCode];

        if (0 > classCode || classCode > 0xFF) {
            throw new RangeError('Invalid ClassCode');
        }
        this._classCode = [classCode];

        if (0 > instanceCode || instanceCode > 0xFF) {
            throw new RangeError('Invalid instanceCode');
        }
        this._instanceCode = [instanceCode];
    }

    byteLength = 3;

    get byteArray(): Uint8Array {
        const data = new Uint8Array(this.byteLength);
        data.set([...(this._classGroupCode), ...(this._classCode), ...(this._instanceCode)]);

        return data;
    }

    toString(): string {
        return `${this._classGroupCode[0].toString(16).padStart(2, '0')} ${this._classCode[0].toString(16).padStart(2, '0')} ${this._instanceCode[0].toString(16).padStart(2, '0')}`;
    }
}

export enum ElService {
    /**
     * プロパティ値書き込み要求不可応答
     * ESV=0x60(SetI)の不可応答
     * 個別応答
     */
    SetI_SNA = 0x50,

    /**
     * プロパティ値書き込み要求不可応答
     * ESV=0x61(SetC)の不可応答
     * 個別応答
     */
    SetC_SNA = 0x51,

    /**
     * プロパティ値読み出し不可応答
     * ESV=0x62(Get)の不可応答
     * 個別応答
     */
    Get_SNA = 0x52,

    /**
     * プロパティ値通知不可応答
     * ESV=0x63(INF_REQ)の不可応答
     * 個別応答
     */
    INF_SNA = 0x53,

    /**
     * プロパティ値書き込み・読み出し不可応答
     * ESV=0x6E(SetGet)の不可応答
     * 個別応答
     */
    SetGet_SNA = 0x5E,

    /**
     * プロパティ値書き込み要求(応答不要)
     * 一斉同報可
     */
    SetI = 0x60,

    /**
     * プロパティ値書き込み要求(応答要)
     * 一斉同報可
     */
    SetC = 0x61,

    /**
     * プロパティ値読み出し要求
     * 一斉同報可
     */
    Get = 0x62,

    /**
     * プロパティ値通知要求
     * 一斉同報可
     */
    INF_REQ = 0x63,

    /**
     * プロパティ値書き込み・読み出し要求
     * 一斉同報可
     */
    SetGet = 0x6E,

    /**
     * プロパティ値書き込み応答
     * ESV=0x61(Set)の応答
     * 個別応答
     */
    Set_Res = 0x71,

    /**
     * プロパティ値読み出し応答
     * ESV=0x62(Get)の応答
     * 個別応答
     */
    Get_Res = 0x72,

    /**
     * プロパティ値通知
     * 自発的なプロパティ値通知・ESV=0x63(INF_REQ)の応答
     * 個別通知・一斉同報通知ともに可
     */
    INF = 0x73,

    /**
     * プロパティ値通知(応答要)
     * 個別通知
     */
    INFC = 0x74,

    /**
     * プロパティ値通知応答
     * ESV=0x74(INFC)の応答
     * 個別応答
     */
    INFC_Res = 0x7A,

    /**
     * プロパティ値書き込み・読み出し応答
     * ESV=0x6E(SetGet)の応答
     * 個別応答
     */
    SetGet_Res = 0x7E
}

export class ElProperty {
    private _propertyCode: number[];
    private _propertyData: ElData;
    constructor(propertyCode: number, propertyData: ElData = new Uint8Array(0)) {
        if (0 > propertyCode || propertyCode > 0xFF) {
            throw new RangeError('Invalid PropertyCode');
        }
        this._propertyCode = [propertyCode];

        if (0 > propertyData.byteLength || propertyData.byteLength > 0xFF) {
            throw new RangeError('Invalid PropertyData Size');
        }
        this._propertyData = propertyData;
    }

    get byteLength(): number {
        return 2 + this._propertyData.byteLength;
    }

    get byteArray(): Uint8Array {
        const data = new Uint8Array(this.byteLength);
        data.set([...(this._propertyCode), this._propertyData.byteLength]);
        data.set(this._propertyData, 2);

        return data;
    }

    get propertyCode(): number {
        return this._propertyCode[0];
    }

    get propertyData(): ElData {
        return this._propertyData;
    }

    toString(): string {
        return `${this._propertyCode[0].toString(16).padStart(2, '0')} = ${Buffer.from(this._propertyData).toString('hex')}`;
    }
}

export interface ElFrameData {
    protocolType: ElProtocol;
    frameFormat: ElFrameFormat;
    transactionId: ElTransactionId;
}

export class ElSpecifiedMessageFrameData implements ElFrameData {
    protocolType: ElProtocol;
    frameFormat: ElFrameFormat;
    transactionId: ElTransactionId;
    sourceElObject: ElObject;
    destinationElObject: ElObject;
    service: ElService;
    properties: ElProperty[];
    constructor(frame: ElFrame) {
        if(((frame[0] >> 4) & 0x0F) === 0x01) {
            this.protocolType = ElProtocol.ECHONET_LITE;
        } else {
            throw new RangeError('Unsupported Protocol Type');
        }

        if(frame[1] !== 0x81) {
            throw new TypeError();
        }
        this.frameFormat = ElFrameFormat.SPECIFIED_MESSAGE_FORMAT;

        this.transactionId = new ElTransactionId((frame[2] << 8) + frame[3]);

        this.sourceElObject = new ElObject(frame[4], frame[5], frame[6]);

        this.destinationElObject = new ElObject(frame[7], frame[8], frame[9]);

        this.service = frame[10];

        const propertyCount = frame[11];
        let pointer = 11;
        this.properties = [];
        for(let i=0; i<propertyCount; i++) {
            this.properties.push(new ElProperty(
                frame[pointer + 1],
                frame.subarray(pointer + 3, pointer + 3 + frame[pointer + 2])
            ));
            pointer += 2 + frame[pointer + 2];
        }
    }
}

export class ElArbitraryMessageFrameData implements ElFrameData {
    protocolType: ElProtocol;
    frameFormat: ElFrameFormat;
    transactionId: ElTransactionId;
    edata: ElData;
    constructor(frame: ElFrame) {
        if(((frame[0] >> 4) & 0x0F) === 0x01) {
            this.protocolType = ElProtocol.ECHONET_LITE;
        } else {
            throw new RangeError('Unsupported Protocol Type');
        }

        if(frame[1] !== 0x82) {
            throw new TypeError();
        }
        this.frameFormat = ElFrameFormat.ARBITRARY_MESSAGE_FORMAT;

        this.transactionId = new ElTransactionId((frame[2] << 8) + frame[3]);

        this.edata = frame.subarray(4);
    }
}

export type ElData = Uint8Array;

export type ElFrame = Uint8Array;

export enum OperationStatus {
    ON = 0x30,
    OFF = 0x31
}

export enum PowerSavingOperationSetting {
    ON = 0x41,
    OFF = 0x42
}

export enum OperationModeSetting {
    /**
     * 自動
     */
    AUTOMATIC = 0x41,

    /**
     * 冷房
     */
    COOLING = 0x42,

    /**
     * 暖房
     */
    HEATING = 0x43,

    /**
     * 除湿
     */
    DEHUMIDIFICATION = 0x44,

    /**
     * 送風
     */
    AIR_CIRCULATOR = 0x45,

    /**
     * その他
     */
    OTHER = 0x40
}

export enum AutomaticTemperatureControlSetting {
    /**
     * AUTO
     */
    AUTOMATIC = 0x41,

    /**
     * 非AUTO
     */
    NON_AUTOMATIC = 0x42
}