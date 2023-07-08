//
//  ContentView.swift
//  SenderApp(2)
//
//  Created by TERMS on 22/6/2023.
//

import SwiftUI



struct ContentView: View {
    @AppStorage("isSubmitted") var isSubmitted: Bool = false

    var body: some View {
        VStack {
            if isSubmitted {
                HomeView().transition(.opacity)
            }
            else{
                RegisterView().transition(.opacity)
            }
        }
    }
    
}
extension UIApplication {

    func endEditing() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)

    }
}
struct RegisterView: View {

    @State var inputPhoneNum: String = ""
    
    var body: some View {
        Background{
            VStack {
                TextField("Phone nubmer", text: $inputPhoneNum)
                    .keyboardType(.asciiCapableNumberPad)
                    .frame(width: 200, height: 50, alignment: .center)
                    .background(Color("lightGray"))
                    .cornerRadius(10)
                    .padding(250)
                    .textContentType(.telephoneNumber)
                    
                Button(action: {
                    self.Submit()
                    ContentView().isSubmitted = true
                    bt.initiate()
                }, label: {
                    SubmitButton(foregroundColor: NotValid() ? .white:.blue)
                })
                .disabled(NotValid())
            }
        }.onTapGesture {
            UIApplication.shared.endEditing()
            self.PhoneNumManager()
        }
        
    }

    func PhoneNumManager(){
        inputPhoneNum = inputPhoneNum.replacingOccurrences(of: " ", with: "")
    }
    
    func Submit(){
        phoneNum = inputPhoneNum
    }
    func NotValid()->Bool {
        if (inputPhoneNum.count == 8){
            return false
        }
        return true
    }
}

struct SubmitButton: View {
    var foregroundColor: Color
    
    var body: some View {
        
        Text("Confirm")
            .bold()
            .foregroundColor(foregroundColor)
            .frame(width: 200, height: 50, alignment: .center)
            .background(Color("lightGray"))
            .cornerRadius(10)
            .padding()
    }
}
struct HomeView: View {
        
    var body: some View {
        VStack{
            Text("HKD \(balance)")
            Text(phoneNum)
        }
        .onAppear{
            bt.initiate()

        }
    }

}

struct ContentView_Previews: PreviewProvider {

    static var previews: some View {
        ContentView()
    }
}

struct Background<Content: View>: View {
    private var content: Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content()
    }

    var body: some View {
        Color.white
        .frame(width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height)
        .overlay(content)
    }
}

