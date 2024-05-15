/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLResolveInfo } from 'graphql';

// *INFO: internal modules
import { ARR_GRAPHQL_ERROR_CODE } from '@constants';
import { EErrorCode } from '@enum';
import { CustomError } from '@error';
import { IContextGraphql } from '@interfaces';
import { generateGraphqlError } from '@utilities';

type IFieldResolver<TSource, TContext, TArgs = Record<string, any>, TReturn = any> = (
  source: TSource,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TReturn;

interface TArgsDefault {
  [argument: string]: any;
}

export const skip = undefined;

export function combineResolvers<TSource = any, TContext = IContextGraphql, TArgs = TArgsDefault>(
  ...funcs: Array<IFieldResolver<TSource, TContext, TArgs>>
) {
  return async (source: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo) => {
    try {
      return await funcs.reduce(
        async (prevPromise, resolver) =>
          prevPromise.then((prev: any) =>
            prev === skip ? resolver(source, args, context, info) : prev
          ),
        Promise.resolve()
      );
    } catch (error) {
      const lang = (context as IContextGraphql).lang ?? 'en';
      const customError = <CustomError>error;

      if (ARR_GRAPHQL_ERROR_CODE.includes(customError.code)) {
        throw generateGraphqlError({
          i18n: { phrase: customError.message, locale: lang },
          code: customError.code,
        });
      }

      throw generateGraphqlError({
        message: customError.message,
        code: EErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  };
}
