import * as ElType from './ElType';

export class ElFrame {
    /**
     * 規定電文形式のフレームを作成する
     * @param tid トランザクションID
     * @param seoj 送信元ELオブジェクト
     * @param deoj 相手先ELオブジェクト
     * @param esv ELサービス
     * @param properties ELプロパティデータの配列
     */
    static createSmfFrame(tid: ElType.ElTransactionId, seoj: ElType.ElObject, deoj: ElType.ElObject, esv: ElType.ElService, properties: ElType.ElProperty[]): ElType.ElFrame {
        if (0 > properties.length || properties.length > 0xFF) {
            throw new RangeError('Invalid Property Count');
        }

        const ehd1 = new ElType.ElHeader1(ElType.ElProtocol.ECHONET_LITE);
        const ehd2 = new ElType.ElHeader2(ElType.ElFrameFormat.SPECIFIED_MESSAGE_FORMAT);
        let dataSize = 8;
        properties.forEach(property => {
            dataSize += property.byteLength;
        });
        const edata = new Uint8Array(dataSize);
        edata.set(seoj.byteArray, 0);
        edata.set(deoj.byteArray, 3);
        edata.set([esv], 6);
        edata.set([properties.length], 7);
        let currentPos = 8;
        properties.forEach(property => {
            edata.set(property.byteArray, currentPos);
            currentPos += property.byteLength;
        });

        return this.createFrame(ehd1, ehd2, tid, edata);
    }

    /**
     * 任意電文形式のフレームを作成する
     * @param tid トランザクションID
     * @param edata ELデータ
     */
    static createAmfFrame(tid: ElType.ElTransactionId, edata: ElType.ElData): ElType.ElFrame {
        const ehd1 = new ElType.ElHeader1(ElType.ElProtocol.ECHONET_LITE);
        const ehd2 = new ElType.ElHeader2(ElType.ElFrameFormat.ARBITRARY_MESSAGE_FORMAT);

        return this.createFrame(ehd1, ehd2, tid, edata);
    }

    /**
     * 任意の形式のフレームを作成する
     * @param ehd1 EL電文ヘッダ1
     * @param ehd2 EL電文ヘッダ2
     * @param tid トランザクションID
     * @param edata ELデータ
     */
    private static createFrame(ehd1: ElType.ElHeader1, ehd2: ElType.ElHeader2, tid: ElType.ElTransactionId, edata: ElType.ElData): ElType.ElFrame {
        const frameSize = 4 + edata.byteLength;
        const frame: Uint8Array = new Uint8Array(frameSize);
        frame.set(ehd1.byteArray, 0);
        frame.set(ehd2.byteArray, 1);
        frame.set(tid.byteArray, 2);
        frame.set(edata, 4);
        return frame;
    }
}
