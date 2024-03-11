import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
    const [recording, setRecording] = useState(null);
    const [recordedSounds, setRecordedSounds] = useState([]);
    const [prerecordedSound, setPrerecordedSound] = useState(null);

    useEffect(() => {
        return () => {
            if (prerecordedSound) {
                prerecordedSound.unloadAsync();
            }
            recordedSounds.forEach(sound => {
                sound.unloadAsync();
            });
        };
    }, [prerecordedSound, recordedSounds]);

    const startRecording = async () => {
        try {
            if (!recording) {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    alert('Permission to access microphone denied!');
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const newRecording = new Audio.Recording();
                await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                await newRecording.startAsync();
                setRecording(newRecording);
            } else {
                console.log('Recording is already in progress.');
            }
        } catch (error) {
            console.error('Failed to start recording', error);
        }
    };

    const stopRecording = async () => {
        try {
            if (recording) {
                await recording.stopAndUnloadAsync();
                const { sound } = await recording.createNewLoadedSoundAsync();
                if (sound) {
                    setRecordedSounds(prevSounds => [...prevSounds, sound]);
                } else {
                    console.warn('Failed to create recorded sound.');
                }
                setRecording(null); // Reset the recording object
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    };

    const playPrerecordedSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('./assets/sounds/sound.m4a')
            );
            setPrerecordedSound(sound);
            await sound.playAsync();
        } catch (error) {
            console.error('Failed to play prerecorded sound', error);
        }
    };

    const playRecordedSound = async (index) => {
        try {
            const soundToPlay = recordedSounds[index];
            if (soundToPlay && soundToPlay instanceof Audio.Sound) {
                await soundToPlay.replayAsync(); // Use replayAsync to play from the beginning
            } else {
                console.warn(`Recorded sound at index ${index} is invalid.`);
            }
        } catch (error) {
            console.error('Failed to play recorded sound', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <Button
                    title={recording ? 'Stop Recording' : 'Start Recording'}
                    onPress={recording ? stopRecording : startRecording}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Play Prerecorded Sound"
                    onPress={playPrerecordedSound}
                />
            </View>
            <View style={styles.buttonContainer}>
                {recordedSounds.map((_, index) => (
                    <Button
                        key={index}
                        title={`Play Recorded Sound ${index + 1}`}
                        onPress={() => playRecordedSound(index)}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        marginBottom: 20,
    },
});
