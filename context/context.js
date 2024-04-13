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

  function swapOptions(options) {
    return Object.assign(
      { slippageTolerance: new Percent(5, 100), recipient: RECIPIENT },

      options
    );
  }

  //buildtrade

  function buildTrade(trade) {
    return new RouterTrade({
      v2Routes: trade
        .filter((trade) => trade instanceof V2Trade)
        .map((trade) => ({
          routev2: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      v3Routes: trades
        .filter((trade) => trade instanceof V3Trade)
        .map((trade) => ({
          routev3: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      mixedRoutes: trades
        .filter((trade) => trade instanceof V3Trade)
        .map((trade) => ({
          mixedRoute: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      tradeType: trades[0].tradeType,
    });
  }

  //demo account

  const RECIPIENT = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

  //swap function

  const swap = async (token_1, token_2, swapInputAmount) => {
    try {
      console.log("calling swap");

      const _inputAmount = 1;
      const provider = web3Provider();
      const network = await provider.getNetwork();

      const ETHER = ETHER.onChain(1);

      //token contract

      const tokenAddress1 = await CONNECTING_CONTRACT("");
      const tokenAddress2 = await CONNECTING_CONTRACT("");

      //token details

      const TOKEN_A = new Token(
        tokenAddress1.chainId,
        tokenAddress1.address,
        tokenAddress1.decimals,
        tokenAddress1.symbol,
        tokenAdderess1.name
      );

      const TOKEN_B = new Token(
        tokenAddress2.chainId,
        tokenAddress2.address,
        tokenAddress2.decimals,
        tokenAddress2.symbol,
        tokenAddress2.name
      );

      const WETH_USDC_V3 = await getPool(
        TOKEN_A,
        TOKEN_B,
        FeeAmount.MEDIUM,
        provider
      );

      const inputEther = ethers.utils.parseEther("1").toString();

      const trade = await V3Trade
        .fromRoute
          ( new RouteV3([WETH_USDC_V3],ETHER,TOKEN_B),
                CurrencyAmount.fromRawAmount(Ether, inputEther),
        昭       TradeType.EXACT_INPUT
        );

      const routerTrade = buildTrade([trade]);

      const opts = swapOptions({});

      const params = SwapRouter.swapERC20CallParameters(routerTrade, opts);

      console.log(WETH_USDC_V3);
      console.log(trade);
      console.log(routerTrade);
      console.log(opts);
      console.log(params);

      let ethBalance;
      let TokenA;
      let TokenB;

      ethBalance = await provider.getBalance(RECIPIENT);

      TokenA = await tokenAddress1.balance;
      TokenB = await tokenAddress2.balance;

      console.log("------Before");

      console.log("ETHBALANCE", ethers.utils.formatUnits(ethBalance, 18));
      console.log("TOKEN A", tokenA);
      console.log("TOKEN B", tokenB);
    } catch (error) {
      const errorMsg = parseErrorMsg(error);
      notifyError(errorMsg);
      console.log(error);
    }
  };
};

export default context;
