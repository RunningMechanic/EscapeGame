import { Alert, Button, Stack } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface Props {
    enabled: boolean
    error: string | null,
    onScanned: (data: any) => Promise<void>;
}

export default (function ({ enabled, error, onScanned }) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanRafRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);


    async function startScan() {
        try {
            setScanError(null);

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            const BarcodeDetectorCtor: any = (globalThis as any).BarcodeDetector;
            if (BarcodeDetectorCtor) {
                const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
                const detectOnce = async () => {
                    if (!enabled) return;
                    if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes?.length) {
                            await onScanned((barcodes[0].rawValue || "").toString())
                        }
                    }
                    scanRafRef.current = requestAnimationFrame(detectOnce);
                };
                scanRafRef.current = requestAnimationFrame(detectOnce);
            } else {
                if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
                const detectOnce = async () => {
                    if (!enabled) return;
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    if (video && canvas && video.videoWidth && video.videoHeight) {
                        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                            if (code?.data) {
                                await onScanned(code.data)
                            }
                        }
                    }
                    scanRafRef.current = requestAnimationFrame(detectOnce);
                };
                scanRafRef.current = requestAnimationFrame(detectOnce);
            }
        } catch (e) {
            console.error(e);
            setScanError("カメラにアクセスできません。");
        }
    }

    async function stopScan() {
        if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }

    useEffect(() => {
        if (enabled) {
            startScan()
        } else {
            stopScan()
        }
    }, [enabled])

    useEffect(() => {
        if (error || scanError) {
            setScanError(error || scanError)
        } else {
            setScanError(null)
        }
    }, [error])

    return (
        <Stack align="center">
            <Alert title="スキャン待機中" color="orange" variant="light">QRコードを読み込んで下さい...</Alert>
            {scanError && <Alert color="red" variant="light" title="エラー">{scanError}</Alert>}
            <video ref={videoRef} style={{ width: "100%", maxHeight: 280, background: "#000", borderRadius: 8 }} muted autoPlay playsInline />
        </Stack>
    )
}) satisfies React.FC<Props>