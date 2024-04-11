import React, { useEffect } from "react";

import { ethers } from "ethers";

import toast from "react-hot-toast";

import JSBI from "jsbi";

import web3Modal from "web3modal";

import { SwapRouter } from "@uniswap/universal-router-sdk";

import {
  TradeType,
  Ether,
  Token,
  CurrencyAmount,
  Percent,
} from "@uniswap/sdk-core";

import { Trade as V2Trade } from "@uniswap/v2-sdk";

import {
  Pool,
  nearestUsableTick,
  TickMth,
  TICK_SPACINGS,
  FeeAmount,
  Trade as V3Trade,
  Route as RouteV3,
} from "@uniswap/v3-sdk";

import { MixedRouteTrade, Trade as RouterTrade } from "@uniswap/router-sdk";

import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";

//Internal_import

import { ERC20_ABI, web3Provider, CONNECTING_CONTRACT } from "./constants";

import { shortenAddress, parseErrorMsg } from "../utils";

export const CONTEXT = React.createContext();

export const Provider = ({ children }) => {
  const TOKEN_SWAP = "TOKEN SWAP DAPP";
  const [loader, setLoader] = useState(false);
  const [address, setAddress] = useState("");
  const [chainID, setChainID] = useState("");

  const notifyError = (msg) => toast.error(msg, { duration: 4000 });

  const notifySuccess = (msg) => toast.sucess(msg, { duration: 4000 });

  //connect wallet function

  const connect = async () => {
    try {
      if (!window.ethereum)
        return notifyError("please install metamsk to continue");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length) {
        setAddress(accounts[0]);
      } else {
        notifyError("Sorry, You have no account");
      }

      const provider = await web3Provider();

      const network = await provider.getNetwork();

      setChainID(network.chainID);
    } catch (error) {
      const errorMsg = parseErrorMsg(error);
      notifyError(errorMsg);
      console.log(error);
    }
  };

  //load token data

  const LOAD_TOKEN = async (token) => {
    try {
      const tokenDetail = await CONNECTING_CONTRACT(token);
      return tokenDetail;
    } catch (error) {
      const errorMsg = parseErrorMsg(error);
      notifyError(errorMsg);
      console.log(error);
    }
  };

  // //internal function

  async function getPool(tokenA, tokenB, feeAmount, provider) {
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    const poolAddress = Pool.getAddress(token0, token1, feeAmount);
    const contract = new ethers.Contract(poolAddress, IUniswapV3Pool, provider);

    let liquidity = await contract.liquidity();

    let { sqrtPriceX96, tick } = await contract.slot0();

    liquidity = JSBI.BigInt(Liquidity.toString());

    sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());

    console.log("CALLAING_POOL-");

    return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
        liquidityGross: liquidity,
      },
    ]);
  }
};



export default context;
