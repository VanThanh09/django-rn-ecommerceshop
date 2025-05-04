import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Stepper = ({ steps, currentStep }) => {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <TouchableOpacity>
                        <View style={styles.stepContainer}>
                            <View
                                style={[
                                    styles.circle,
                                    index <= currentStep ? styles.activeCircle : styles.inactiveCircle
                                ]}
                            />
                            <Text
                                style={[
                                    styles.label,
                                    index <= currentStep ? styles.activeLabel : styles.inactiveLabel
                                ]}
                            >
                                {step}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {index < steps.length - 1 && (
                        <View style={styles.line} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        margin: 10
    },
    stepContainer: {
        alignItems: 'center',
        width: 80,
    },
    circle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 4,
    },
    activeCircle: {
        backgroundColor: 'orange',
    },
    inactiveCircle: {
        backgroundColor: '#ccc',
    },
    label: {
        fontSize: 12,
        textAlign: 'center',
    },
    activeLabel: {
        color: 'black',
        fontWeight: 'bold',
    },
    inactiveLabel: {
        color: '#aaa',
    },
    line: {
        width: 20,
        height: 1,
        backgroundColor: '#ccc',
        marginHorizontal: 2,
    },
});

export default Stepper;