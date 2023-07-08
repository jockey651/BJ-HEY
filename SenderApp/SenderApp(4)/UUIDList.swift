//
//  UUIDList.swift
//  SenderApp
//
//  Created by TERMS on 22/6/2023.
//

import CoreBluetooth

var balance: Double = 0.0
var phoneNum: String = "55467248"

class TransferService: NSObject{
    public static let serviceUUID     = CBUUID.init(string: "4eaeddb4-5ba4-4ceb-8522-3552e3f79e2f")
    public static let characteristicUUID   = CBUUID.init(string: "5191fdf7-4546-4e3f-9946-0b0bfa0a4f26")
}

