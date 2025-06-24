import React from "react";
import { View } from "react-native";
import Barcode from "react-native-barcode-svg";

interface BarcodeComponentProps {
  value: string;
  height?: number;
  width?: number;
  text?: string;
}

const BarcodeComponent = ({
  value,
  height = 50,
  width = 1,
  text,
}: BarcodeComponentProps) => {
  return (
    <View>
      <Barcode value={value} height={height} maxWidth={300} />
    </View>
  );
};

export default BarcodeComponent;
