import { CameraView, useCameraPermissions, type CameraType } from "expo-camera"
import React, { useEffect, useRef, useState } from "react"
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"

type CapturedAsset = { uri: string; base64?: string | null }

type Props = {
  visible: boolean
  /** Previous progress photo shown as a semi-transparent alignment guide */
  ghostUri?: string | null
  onClose: () => void
  onCapture: (asset: CapturedAsset) => void
}

export default function ProgressCamera({ visible, ghostUri, onClose, onCapture }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>("back")
  const [ghostOn, setGhostOn] = useState(true)
  const [timerOn, setTimerOn] = useState(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturing, setCapturing] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!visible) {
      // Reset transient state when the modal closes
      setCountdown(null)
      setCapturing(false)
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
        countdownTimer.current = null
      }
    }
  }, [visible])

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return
    setCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true })
      if (photo?.uri) onCapture({ uri: photo.uri, base64: photo.base64 })
    } catch (e) {
      console.warn("ProgressCamera capture failed:", e)
    } finally {
      setCapturing(false)
      setCountdown(null)
    }
  }

  const onShutter = () => {
    if (capturing || countdown !== null) return
    if (!timerOn) {
      takePhoto()
      return
    }
    let n = 3
    setCountdown(n)
    countdownTimer.current = setInterval(() => {
      n -= 1
      if (n <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current)
          countdownTimer.current = null
        }
        setCountdown(null)
        takePhoto()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const cancelCountdown = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
    setCountdown(null)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              CaptureFit uses the camera to take your progress photos.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Allow camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ghost of the previous photo for consistent framing */}
        {permission?.granted && ghostOn && ghostUri ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: ghostUri }}
              style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {countdown !== null && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        <SafeAreaView style={styles.controls} pointerEvents="box-none">
          <View style={styles.topRow}>
            <TouchableOpacity accessibilityLabel="Close camera" style={styles.iconButton} onPress={onClose}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.topRightGroup}>
              {ghostUri ? (
                <TouchableOpacity
                  accessibilityLabel="Toggle previous photo overlay"
                  style={[styles.iconButton, ghostOn && styles.iconButtonActive]}
                  onPress={() => setGhostOn((v) => !v)}
                >
                  <Feather name="layers" size={22} color="white" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Toggle 3 second timer"
                style={[styles.iconButton, timerOn && styles.iconButtonActive]}
                onPress={() => setTimerOn((v) => !v)}
              >
                <Feather name="clock" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Flip camera"
                style={styles.iconButton}
                onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              >
                <Feather name="refresh-ccw" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {ghostUri && ghostOn && countdown === null ? (
            <Text style={styles.hint}>Line yourself up with your last photo</Text>
          ) : null}

          <View style={styles.bottomRow}>
            {countdown !== null ? (
              <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityLabel="Take photo"
                style={[styles.shutter, capturing && { opacity: 0.5 }]}
                onPress={onShutter}
                disabled={!permission?.granted || capturing}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  permissionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  controls: {
    flex: 1,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topRightGroup: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonActive: {
    backgroundColor: "rgba(16,185,129,0.7)",
  },
  hint: {
    alignSelf: "center",
    color: "white",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
    fontSize: 13,
  },
  bottomRow: {
    alignItems: "center",
    paddingBottom: 24,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  cancelText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    color: "white",
    fontSize: 110,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 12,
  },
})
