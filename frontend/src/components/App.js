import React, { Component } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; 
import AuthPage from "./AuthPage"; 
import HomePage from "./HomePage";
import CreateChatAndMessage from "./CreateChatandMessage";
import TestGroqApi from "./TestGroqApi"

export default class App extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Router>  
                <Routes>
                    <Route exact path="/" element={<AuthPage/>} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/chat" element={<CreateChatAndMessage />} />
                    <Route path="/groq" element={<TestGroqApi/>} />
                </Routes>
            </Router>
        );
    }
}

// Rendering the component to the DOM
const appDiv = document.getElementById("app");
render(<App />, appDiv);