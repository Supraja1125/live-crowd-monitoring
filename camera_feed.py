import cv2

def start_camera(source=0):
    """
    Opens the camera.
    source = 0 → default laptop webcam
    """
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(" Error: Cannot open camera")
        return None
    print(" Camera opened successfully")
    return cap


def read_frame(cap):
    """
    Reads a single frame from camera.
    Returns None if it fails.
    """
    if cap is None:
        return None

    ret, frame = cap.read()
    if not ret:
        print(" Warning: Can't receive frame (stream end?).")
        return None
    return frame


def stop_camera(cap):
    """
    Releases the camera and closes all OpenCV windows.
    """
    if cap is not None:
        cap.release()
    cv2.destroyAllWindows()
    print(" Camera closed")
