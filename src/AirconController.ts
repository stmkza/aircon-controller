import * as ElType from "./ElType";
import { Socket, createSocket } from "dgram";
import { ElFrame } from "./ElFrame";

export class AirconController {
    host: string;
    port: number;
    private promises: Array<Function[]> = new Array(0x10000);
    private recieveServer: Socket;
    private initializeCompleted: boolean = false;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;

        this.recieveServer = createSocket('udp4');
        this.recieveServer.on('error', console.error);
        this.recieveServer.on('message', (message, remote) => {
            const frame = new Uint8Array(message);
            try {
                const smFrameData = new ElType.ElSpecifiedMessageFrameData(frame);
                if(this.promises[smFrameData.transactionId.value]) {
                    this.promises[smFrameData.transactionId.value][0](smFrameData);
                } else {
                    return;
                }
            } catch (exception) {
                console.error(exception);
            }
        });
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.recieveServer.bind(this.port, '0.0.0.0', () => {
                this.initializeCompleted = true;
                resolve();
            });
        });
    }
    
    finalize() {
        return new Promise((resolve, reject) => {
            this.recieveServer.close(() => {
                resolve();
            })
        });
    }

    sendFrame(seoj: ElType.ElObject, deoj: ElType.ElObject, esv: ElType.ElService, properties: ElType.ElProperty[], timeout = 7000): Promise<ElType.ElSpecifiedMessageFrameData> {
        return new Promise((resolve, reject) => {
            if(!this.initializeCompleted) {
                reject('サーバが初期化されていません');
            }
            let tid = -1;
            let i = 0;
            do {
                tid = Math.floor(Math.random() * 0x10000);
                if(!this.promises[tid]) {
                    this.promises[tid] = [resolve, reject];
                    break;
                }
                if(++i > 10) {
                    reject('トランザクションIDが枯渇しています');
                }
            } while(true);

            const transactionId = new ElType.ElTransactionId(tid);
            const frameData = ElFrame.createSmfFrame(transactionId, seoj, deoj, esv, properties);
            const client = createSocket('udp4');
            client.send(frameData, this.port, this.host, () => {
                client.close();
            });
        });
    }
    
    getPowerState(): Promise<ElType.ElSpecifiedMessageFrameData> {
        return this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.Get,
            [
                new ElType.ElProperty(0x80),
            ]
        );
    }
}
